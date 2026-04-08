# Cryptography & Data Protection

> **Ziel:** Government/Banking-Grade Datenschutz und Verschlüsselung  
> **Stack:** ASP.NET Core 10 Data Protection, PostgreSQL, OpenSSL  
> **Schwerpunkt:** Encryption at Rest/Transit, Key Management, Hashing

---

## Inhaltsverzeichnis

- [1. Cryptography Architecture](#1-cryptography-architecture)
- [2. ASP.NET Core Data Protection API](#2-aspnet-core-data-protection-api)
- [3. Encryption at Rest](#3-encryption-at-rest)
- [4. Encryption in Transit (TLS)](#4-encryption-in-transit-tls)
- [5. Hashing & Password Storage](#5-hashing--password-storage)
- [6. Digital Signatures](#6-digital-signatures)
- [7. Key Management](#7-key-management)
- [8. Database Encryption (PostgreSQL)](#8-database-encryption-postgresql)
- [9. File & Document Encryption](#9-file--document-encryption)
- [10. Secrets Management](#10-secrets-management)

---

## 1. Cryptography Architecture

### 1.1 Übersicht

```
┌────────────────────────────────────────────────────────┐
│                 Cryptography Layers                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: Transport (TLS 1.3)                           │
│  ├── Client ↔ Caddy: TLS 1.3 (ECDHE + AES-256-GCM)    │
│  ├── Caddy ↔ API: Internal TLS / Unix Socket            │
│  ├── API ↔ PostgreSQL: TLS 1.3 (verify-full)            │
│  └── API ↔ Redis: TLS 1.3                               │
│                                                         │
│  Layer 2: Application (Data Protection API)              │
│  ├── Cookie Encryption                                   │
│  ├── Anti-Forgery Tokens                                 │
│  ├── Temporary Data Protection                           │
│  └── Custom Field Encryption                             │
│                                                         │
│  Layer 3: Database (PostgreSQL)                          │
│  ├── pgcrypto (Column-Level Encryption)                  │
│  ├── TDE (Transparent Data Encryption)                   │
│  └── LUKS (Volume Encryption)                            │
│                                                         │
│  Layer 4: Storage                                        │
│  ├── LUKS dm-crypt (Disk Encryption)                     │
│  ├── Encrypted Volumes (Podman)                          │
│  └── Encrypted Backups (GPG)                             │
│                                                         │
│  Layer 5: Key Management                                 │
│  ├── Key Rotation (90 Tage)                              │
│  ├── Key Hierarchy (Master → Data Keys)                  │
│  └── Secure Key Storage (File + Permissions)             │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 1.2 Algorithmus-Matrix

```
Anwendung             │ Algorithmus       │ Key Size  │ Modus
──────────────────────┼───────────────────┼───────────┼──────────
Symmetric Encryption  │ AES               │ 256 bit   │ GCM
Asymmetric Encryption │ RSA               │ 4096 bit  │ OAEP-SHA512
JWT Signing           │ RSA               │ 4096 bit  │ RS512
Digital Signatures    │ ECDSA             │ P-384     │ SHA-384
Password Hashing      │ Argon2id          │ -         │ t=4,m=64MB,p=2
HMAC                  │ HMAC-SHA512       │ 512 bit   │ -
Key Derivation        │ HKDF-SHA256       │ 256 bit   │ -
TLS                   │ TLS 1.3           │ -         │ AES-256-GCM
Disk Encryption       │ LUKS2 (aes-xts)   │ 512 bit   │ XTS
Backup Encryption     │ GPG (AES-256)     │ 4096 RSA  │ CFB
Random Generation     │ CSPRNG            │ -         │ /dev/urandom
```

---

## 2. ASP.NET Core Data Protection API

### 2.1 Konfiguration

```csharp
// Program.cs
builder.Services.AddDataProtection()
    // Schlüssel im Dateisystem (mit Berechtigungen)
    .PersistKeysToFileSystem(new DirectoryInfo("/app/keys"))
    // Automatische Key-Rotation (90 Tage)
    .SetDefaultKeyLifetime(TimeSpan.FromDays(90))
    // Application Name für Key-Isolation
    .SetApplicationName("MyBankingApp")
    // Verschlüsselung der Keys at Rest
    .ProtectKeysWithCertificate(
        new X509Certificate2("/run/secrets/dp-cert.pfx", 
            builder.Configuration["DataProtection:CertPassword"]))
    // AES-256-CBC + HMAC-SHA256
    .UseCryptographicAlgorithms(new AuthenticatedEncryptorConfiguration
    {
        EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM,
        ValidationAlgorithm = ValidationAlgorithm.HMACSHA512
    });
```

### 2.2 Custom Field Encryption

```csharp
public interface IFieldEncryptionService
{
    string Encrypt(string plaintext, string purpose);
    string Decrypt(string ciphertext, string purpose);
    string EncryptWithExpiry(string plaintext, string purpose, TimeSpan lifetime);
}

public class FieldEncryptionService : IFieldEncryptionService
{
    private readonly IDataProtectionProvider _provider;
    
    public FieldEncryptionService(IDataProtectionProvider provider)
    {
        _provider = provider;
    }
    
    public string Encrypt(string plaintext, string purpose)
    {
        var protector = _provider.CreateProtector(purpose);
        return protector.Protect(plaintext);
    }
    
    public string Decrypt(string ciphertext, string purpose)
    {
        var protector = _provider.CreateProtector(purpose);
        return protector.Unprotect(ciphertext);
    }
    
    public string EncryptWithExpiry(string plaintext, string purpose, TimeSpan lifetime)
    {
        var protector = _provider.CreateProtector(purpose)
            .ToTimeLimitedDataProtector();
        return protector.Protect(plaintext, lifetime);
    }
}

// Registrierung
builder.Services.AddSingleton<IFieldEncryptionService, FieldEncryptionService>();

// Nutzung
public class UserService
{
    private readonly IFieldEncryptionService _encryption;
    
    public async Task<User> CreateUser(CreateUserDto dto)
    {
        var user = new User
        {
            Email = dto.Email,
            // Sensitive Daten verschlüsseln
            SocialSecurityNumber = _encryption.Encrypt(
                dto.SocialSecurityNumber, "User.SSN"),
            BankAccountNumber = _encryption.Encrypt(
                dto.BankAccountNumber, "User.BankAccount"),
            PhoneNumber = _encryption.Encrypt(
                dto.PhoneNumber, "User.Phone"),
        };
        // Speichern ...
        return user;
    }
}
```

### 2.3 EF Core Value Converter (Auto-Encryption)

```csharp
// Automatische Verschlüsselung in EF Core
public class EncryptedStringConverter : ValueConverter<string, string>
{
    public EncryptedStringConverter(IFieldEncryptionService encryption, string purpose)
        : base(
            v => encryption.Encrypt(v, purpose),
            v => encryption.Decrypt(v, purpose))
    {
    }
}

// DbContext Konfiguration
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    var encryption = _serviceProvider.GetRequiredService<IFieldEncryptionService>();
    
    modelBuilder.Entity<User>(entity =>
    {
        entity.Property(e => e.SocialSecurityNumber)
            .HasConversion(new EncryptedStringConverter(encryption, "User.SSN"));
        
        entity.Property(e => e.BankAccountNumber)
            .HasConversion(new EncryptedStringConverter(encryption, "User.BankAccount"));
    });
}
```

---

## 3. Encryption at Rest

### 3.1 LUKS Disk Encryption

```bash
# LUKS2 Verschlüsselung für Daten-Partition
cryptsetup luksFormat --type luks2 \
  --cipher aes-xts-plain64 \
  --key-size 512 \
  --hash sha512 \
  --iter-time 5000 \
  --pbkdf argon2id \
  --pbkdf-memory 1048576 \
  --pbkdf-parallel 4 \
  /dev/sdb1

# Öffnen
cryptsetup luksOpen /dev/sdb1 data_encrypted

# Dateisystem erstellen
mkfs.xfs /dev/mapper/data_encrypted

# Mounten
mount /dev/mapper/data_encrypted /data

# Auto-Mount (mit Key-File)
echo "data_encrypted UUID=$(blkid -s UUID -o value /dev/sdb1) /root/luks-key luks" >> /etc/crypttab
```

### 3.2 Podman Encrypted Volumes

```bash
# Verschlüsseltes LUKS Volume für Container-Daten
cryptsetup luksFormat --type luks2 \
  --cipher aes-xts-plain64 \
  --key-size 512 \
  /dev/sdc1

cryptsetup luksOpen /dev/sdc1 container_data
mkfs.xfs /dev/mapper/container_data
mount /dev/mapper/container_data /var/lib/containers

# PostgreSQL Daten-Volume verschlüsselt
podman volume create \
  --opt type=none \
  --opt o=bind \
  --opt device=/data/postgres \
  pg_data_encrypted
```

---

## 4. Encryption in Transit (TLS)

### 4.1 TLS 1.3 Konfiguration (System-wide)

```bash
# /etc/crypto-policies/back-ends/openssl.config
# Rocky Linux Crypto Policy (FUTURE)
update-crypto-policies --set FUTURE

# Oder Custom Policy
cat > /etc/crypto-policies/policies/modules/BANKING.pmod << 'EOF'
min_tls_version = TLS1.3
tls_cipher = AES-256-GCM-SHA384:CHACHA20-POLY1305-SHA256
hash = SHA2-384 SHA2-512
sign = ECDSA-SHA2-384 ECDSA-SHA2-512 RSA-PSS-SHA2-384 RSA-PSS-SHA2-512
key_exchange = ECDHE
group = X448 X25519 SECP384R1
EOF

update-crypto-policies --set FUTURE:BANKING
```

### 4.2 PostgreSQL TLS

```ini
# postgresql.conf
ssl = on
ssl_cert_file = '/etc/postgresql/tls/server.crt'
ssl_key_file = '/etc/postgresql/tls/server.key'
ssl_ca_file = '/etc/postgresql/tls/ca.crt'
ssl_min_protocol_version = 'TLSv1.3'
ssl_ciphers = 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256'

# Client-Zertifikat erzwingen
ssl_prefer_server_ciphers = on
```

```ini
# pg_hba.conf — Nur TLS-Verbindungen
hostssl all all 10.89.0.0/24 scram-sha-256 clientcert=verify-full
```

### 4.3 ASP.NET Core TLS-Verbindung zu PostgreSQL

```csharp
// Connection String
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(
        "Host=db;Port=5432;Database=myapp;" +
        "Username=app_user;Password=***;" +
        "SSL Mode=VerifyFull;" +
        "Root Certificate=/app/certs/ca.crt;" +
        "SSL Certificate=/app/certs/client.crt;" +
        "SSL Key=/app/certs/client.key;" +
        "Trust Server Certificate=false;",
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(3);
        });
});
```

---

## 5. Hashing & Password Storage

### 5.1 Argon2id (ASP.NET Core Identity)

```csharp
// Custom Identity Password Hasher (Argon2id)
public class Argon2PasswordHasher<TUser> : IPasswordHasher<TUser> where TUser : class
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int DegreeOfParallelism = 2;
    private const int MemorySize = 65536;  // 64 MB
    private const int Iterations = 4;
    
    public string HashPassword(TUser user, string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        
        var hash = Argon2id.Hash(
            password: Encoding.UTF8.GetBytes(password),
            salt: salt,
            degreeOfParallelism: DegreeOfParallelism,
            memorySize: MemorySize,
            iterations: Iterations,
            hashLength: HashSize);
        
        // Format: $argon2id$v=19$m=65536,t=4,p=2$[salt]$[hash]
        return $"$argon2id$v=19$m={MemorySize},t={Iterations},p={DegreeOfParallelism}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }
    
    public PasswordVerificationResult VerifyHashedPassword(
        TUser user, string hashedPassword, string providedPassword)
    {
        // Parse hash parameters
        var parts = hashedPassword.Split('$');
        if (parts.Length < 6) return PasswordVerificationResult.Failed;
        
        var salt = Convert.FromBase64String(parts[4]);
        var expectedHash = Convert.FromBase64String(parts[5]);
        
        var computedHash = Argon2id.Hash(
            password: Encoding.UTF8.GetBytes(providedPassword),
            salt: salt,
            degreeOfParallelism: DegreeOfParallelism,
            memorySize: MemorySize,
            iterations: Iterations,
            hashLength: HashSize);
        
        // Constant-time Vergleich
        if (CryptographicOperations.FixedTimeEquals(computedHash, expectedHash))
        {
            return PasswordVerificationResult.Success;
        }
        
        return PasswordVerificationResult.Failed;
    }
}

// Registrierung
builder.Services.AddScoped<IPasswordHasher<ApplicationUser>, Argon2PasswordHasher<ApplicationUser>>();
```

### 5.2 HMAC für API Keys

```csharp
public class ApiKeyService
{
    // API Key generieren
    public (string Key, string Hash) GenerateApiKey()
    {
        // Prefix für Identifikation
        var prefix = "myapp";
        var random = RandomNumberGenerator.GetBytes(32);
        var key = $"{prefix}_{Convert.ToBase64String(random).Replace("+", "-").Replace("/", "_").TrimEnd('=')}";
        
        // HMAC-SHA512 für Storage
        var hash = ComputeHmac(key);
        
        return (key, hash);
    }
    
    // API Key validieren
    public bool ValidateApiKey(string providedKey, string storedHash)
    {
        var computedHash = ComputeHmac(providedKey);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computedHash),
            Encoding.UTF8.GetBytes(storedHash));
    }
    
    private static string ComputeHmac(string input)
    {
        var key = Encoding.UTF8.GetBytes(
            Environment.GetEnvironmentVariable("API_KEY_HMAC_SECRET") 
            ?? throw new InvalidOperationException("HMAC secret not configured"));
        
        var hash = HMACSHA512.HashData(key, Encoding.UTF8.GetBytes(input));
        return Convert.ToBase64String(hash);
    }
}
```

---

## 6. Digital Signatures

### 6.1 Document Signing (ECDSA)

```csharp
public class DocumentSigningService
{
    private readonly ECDsa _privateKey;
    private readonly ECDsa _publicKey;
    
    public DocumentSigningService()
    {
        // Private Key laden
        _privateKey = ECDsa.Create();
        _privateKey.ImportFromPem(File.ReadAllText("/run/secrets/signing-key.pem"));
        
        // Public Key für Verifizierung
        _publicKey = ECDsa.Create();
        _publicKey.ImportFromPem(File.ReadAllText("/app/certs/signing-key-pub.pem"));
    }
    
    public string SignDocument(byte[] document)
    {
        var hash = SHA384.HashData(document);
        var signature = _privateKey.SignHash(hash);
        return Convert.ToBase64String(signature);
    }
    
    public bool VerifySignature(byte[] document, string signature)
    {
        var hash = SHA384.HashData(document);
        var signatureBytes = Convert.FromBase64String(signature);
        return _publicKey.VerifyHash(hash, signatureBytes);
    }
    
    // Audit Trail Signierung
    public string SignAuditEntry(AuditEntry entry)
    {
        var data = JsonSerializer.SerializeToUtf8Bytes(entry);
        return SignDocument(data);
    }
}
```

### 6.2 Key-Generierung

```bash
# ECDSA P-384 Key Pair für Document Signing
openssl ecparam -genkey -name secp384r1 | openssl ec -out signing-key.pem
openssl ec -in signing-key.pem -pubout -out signing-key-pub.pem

# RSA 4096 Key Pair für JWT
openssl genrsa -out jwt-private-key.pem 4096
openssl rsa -in jwt-private-key.pem -pubout -out jwt-public-key.pem

# Data Protection Certificate
openssl req -x509 -newkey rsa:4096 -sha512 \
  -days 365 -nodes \
  -keyout dp-key.pem -out dp-cert.pem \
  -subj "/CN=DataProtection/O=MyApp"
openssl pkcs12 -export -out dp-cert.pfx \
  -inkey dp-key.pem -in dp-cert.pem
```

---

## 7. Key Management

### 7.1 Key Hierarchy

```
Master Key (HSM/KMS — oder verschlüsselte Datei)
  │
  ├── Data Encryption Key (DEK) — für Spalten-Verschlüsselung
  │     └── Rotiert alle 90 Tage
  │
  ├── JWT Signing Key (RSA 4096)
  │     └── Rotiert alle 180 Tage
  │
  ├── Data Protection Key (Auto-managed)
  │     └── Rotiert alle 90 Tage (ASP.NET Core)
  │
  ├── TLS Certificates
  │     └── Rotiert alle 90 Tage (Let's Encrypt Auto)
  │
  └── Backup Encryption Key (GPG)
        └── Rotiert jährlich
```

### 7.2 Key Rotation Script

```bash
#!/bin/bash
# key-rotation.sh — Automatische Key-Rotation

set -euo pipefail

KEY_DIR="/etc/myapp/keys"
BACKUP_DIR="/etc/myapp/keys/archived"
DATE=$(date +%Y%m%d)

echo "=== Key Rotation $(date) ==="

# 1. JWT Keys rotieren
echo "Rotating JWT keys..."
mkdir -p "$BACKUP_DIR"
cp "$KEY_DIR/jwt-private-key.pem" "$BACKUP_DIR/jwt-private-key-${DATE}.pem"

openssl genrsa -out "$KEY_DIR/jwt-private-key-new.pem" 4096
openssl rsa -in "$KEY_DIR/jwt-private-key-new.pem" \
  -pubout -out "$KEY_DIR/jwt-public-key-new.pem"

# Atomisches Rename
mv "$KEY_DIR/jwt-private-key-new.pem" "$KEY_DIR/jwt-private-key.pem"
mv "$KEY_DIR/jwt-public-key-new.pem" "$KEY_DIR/jwt-public-key.pem"

chmod 600 "$KEY_DIR/jwt-private-key.pem"
chmod 644 "$KEY_DIR/jwt-public-key.pem"

# 2. ECDSA Signing Key rotieren
echo "Rotating signing keys..."
cp "$KEY_DIR/signing-key.pem" "$BACKUP_DIR/signing-key-${DATE}.pem"

openssl ecparam -genkey -name secp384r1 | \
  openssl ec -out "$KEY_DIR/signing-key-new.pem" 2>/dev/null
openssl ec -in "$KEY_DIR/signing-key-new.pem" \
  -pubout -out "$KEY_DIR/signing-key-pub-new.pem" 2>/dev/null

mv "$KEY_DIR/signing-key-new.pem" "$KEY_DIR/signing-key.pem"
mv "$KEY_DIR/signing-key-pub-new.pem" "$KEY_DIR/signing-key-pub.pem"

chmod 600 "$KEY_DIR/signing-key.pem"
chmod 644 "$KEY_DIR/signing-key-pub.pem"

# 3. Application neu starten
echo "Restarting application..."
systemctl --user restart myapp-api.service

# 4. Alte Keys nach 180 Tagen löschen
find "$BACKUP_DIR" -name "*.pem" -mtime +180 -delete

echo "=== Key Rotation complete ==="
```

### 7.3 Podman Secrets für Keys

```bash
# Secrets erstellen (nicht in Container-Image!)
podman secret create jwt-private-key /etc/myapp/keys/jwt-private-key.pem
podman secret create signing-key /etc/myapp/keys/signing-key.pem
podman secret create db-password /etc/myapp/secrets/db-password.txt
podman secret create dp-cert /etc/myapp/keys/dp-cert.pfx

# Container mit Secrets starten
podman run -d \
  --name api \
  --secret jwt-private-key,target=/run/secrets/jwt-private-key.pem \
  --secret signing-key,target=/run/secrets/signing-key.pem \
  --secret dp-cert,target=/run/secrets/dp-cert.pfx \
  --secret db-password,target=/run/secrets/db-password,type=env \
  myapp-api:latest
```

---

## 8. Database Encryption (PostgreSQL)

### 8.1 pgcrypto Column-Level Encryption

```sql
-- pgcrypto Extension aktivieren
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verschlüsselte Spalten
CREATE TABLE sensitive_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Verschlüsselte Felder (AES-256)
    ssn_encrypted BYTEA,
    bank_account_encrypted BYTEA,
    credit_card_encrypted BYTEA,
    
    -- Nicht-verschlüsselte Metadaten
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daten verschlüsseln (Insert)
INSERT INTO sensitive_data (user_id, ssn_encrypted, bank_account_encrypted)
VALUES (
    '...',
    pgp_sym_encrypt('123-45-6789', current_setting('app.encryption_key')),
    pgp_sym_encrypt('DE89370400440532013000', current_setting('app.encryption_key'))
);

-- Daten entschlüsseln (Select)
SELECT 
    user_id,
    pgp_sym_decrypt(ssn_encrypted, current_setting('app.encryption_key')) AS ssn,
    pgp_sym_decrypt(bank_account_encrypted, current_setting('app.encryption_key')) AS bank_account
FROM sensitive_data
WHERE user_id = '...';
```

### 8.2 Row-Level Security + Encryption

```sql
-- RLS für verschlüsselte Daten
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_own_data ON sensitive_data
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Encryption Key nicht in Logs
ALTER SYSTEM SET log_statement = 'ddl';  -- Nur DDL loggen
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Langsame Queries > 1s
```

---

## 9. File & Document Encryption

### 9.1 Datei-Verschlüsselung in ASP.NET Core

```csharp
public class FileEncryptionService
{
    public async Task<byte[]> EncryptFileAsync(Stream inputStream, byte[] key)
    {
        using var aes = Aes.Create();
        aes.KeySize = 256;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;
        aes.Key = key;
        aes.GenerateIV();
        
        using var outputStream = new MemoryStream();
        
        // IV am Anfang speichern
        await outputStream.WriteAsync(aes.IV);
        
        // HMAC für Integrität
        using var hmac = new HMACSHA256(key);
        
        using (var cryptoStream = new CryptoStream(
            outputStream, aes.CreateEncryptor(), CryptoStreamMode.Write, leaveOpen: true))
        {
            await inputStream.CopyToAsync(cryptoStream);
        }
        
        // HMAC über IV + Ciphertext
        outputStream.Position = 0;
        var mac = await hmac.ComputeHashAsync(outputStream);
        await outputStream.WriteAsync(mac);
        
        return outputStream.ToArray();
    }
    
    public async Task<byte[]> DecryptFileAsync(byte[] encryptedData, byte[] key)
    {
        // HMAC prüfen (letzte 32 Bytes)
        var macLength = 32;
        var mac = encryptedData[^macLength..];
        var dataWithoutMac = encryptedData[..^macLength];
        
        using var hmac = new HMACSHA256(key);
        var computedMac = hmac.ComputeHash(dataWithoutMac);
        
        if (!CryptographicOperations.FixedTimeEquals(mac, computedMac))
        {
            throw new CryptographicException("Data integrity check failed");
        }
        
        // IV extrahieren (erste 16 Bytes)
        var iv = dataWithoutMac[..16];
        var ciphertext = dataWithoutMac[16..];
        
        using var aes = Aes.Create();
        aes.KeySize = 256;
        aes.Key = key;
        aes.IV = iv;
        
        using var outputStream = new MemoryStream();
        using (var cryptoStream = new CryptoStream(
            new MemoryStream(ciphertext), aes.CreateDecryptor(), CryptoStreamMode.Read))
        {
            await cryptoStream.CopyToAsync(outputStream);
        }
        
        return outputStream.ToArray();
    }
}
```

---

## 10. Secrets Management

### 10.1 Environment-basiertes Secrets Management

```csharp
// Program.cs — Secrets Configuration
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddEnvironmentVariables(prefix: "MYAPP_")
    // Podman Secrets als Dateien einlesen
    .AddKeyPerFile("/run/secrets", optional: true);

// NIEMALS Secrets in appsettings.json!
// Secrets kommen aus:
// 1. Environment Variables (Podman --env-file)
// 2. Podman Secrets (--secret)
// 3. /run/secrets/ Verzeichnis
```

### 10.2 Secrets Rotation

```bash
#!/bin/bash
# rotate-db-password.sh

set -euo pipefail

NEW_PASSWORD=$(openssl rand -base64 32)

# 1. Neues Passwort in PostgreSQL setzen
podman exec postgres psql -U postgres -c \
  "ALTER USER app_user WITH PASSWORD '${NEW_PASSWORD}';"

# 2. Podman Secret aktualisieren
echo -n "${NEW_PASSWORD}" | podman secret create db-password-new -
podman secret rm db-password 2>/dev/null || true
# Note: Podman secrets sind immutable — neuen Namen verwenden oder Container neu erstellen

# 3. Container mit neuem Secret neu starten
podman stop api
podman rm api
podman run -d --name api \
  --secret db-password-new,target=/run/secrets/db-password \
  myapp-api:latest

echo "Database password rotated successfully"
```

### 10.3 Security-Checkliste Cryptography

```yaml
Encryption:
  ✅ AES-256-GCM für symmetrische Verschlüsselung
  ✅ RSA-4096 für asymmetrische Verschlüsselung
  ✅ TLS 1.3 für alle Verbindungen
  ✅ LUKS2 für Disk Encryption
  ✅ pgcrypto für Column-Level Encryption
  ✅ HMAC-SHA512 für Datenintegrität

Hashing:
  ✅ Argon2id für Passwörter (t=4, m=64MB, p=2)
  ✅ SHA-384/512 für Signaturen
  ✅ HMAC-SHA512 für API Keys
  ✅ Constant-time Vergleiche (CryptographicOperations.FixedTimeEquals)

Key Management:
  ✅ Key Rotation alle 90 Tage
  ✅ Keys niemals in Code/Config
  ✅ Podman Secrets für Container
  ✅ /run/secrets/ Mount
  ✅ CSPRNG für Zufallsgenerierung (RandomNumberGenerator)
  ✅ Alte Keys archiviert (180 Tage Aufbewahrung)

Verboten:
  ❌ MD5, SHA1 (gebrochen)
  ❌ DES, 3DES, RC4 (veraltet)
  ❌ ECB Mode (Pattern erkennbar)
  ❌ Hardcoded Keys/Passwords
  ❌ TLS < 1.3
  ❌ Eigene Crypto-Implementierungen
```

---

## Weiterführende Dokumente

| Nächstes Dokument | Thema |
|-------------------|-------|
| [08 — Authentication](08-authentication-identity.md) | JWT & Token Security |
| [10 — Monitoring](10-monitoring-logging-incident-response.md) | Key-Rotation Monitoring |
| [14 — Compliance](14-compliance-audit-pentest.md) | Crypto Compliance Standards |
