# Authentication & Identity Management

> **Ziel:** Government/Banking-Grade Authentifizierung  
> **Stack:** ASP.NET Core 10 Identity, Angular 21, FIDO2/WebAuthn  
> **Schwerpunkt:** Multi-Factor Authentication, Passwordless, Token Security

---

## Inhaltsverzeichnis

- [1. Authentication Architecture](#1-authentication-architecture)
- [2. ASP.NET Core Identity Setup](#2-aspnet-core-identity-setup)
- [3. JWT Token Security](#3-jwt-token-security)
- [4. Multi-Factor Authentication (MFA)](#4-multi-factor-authentication-mfa)
- [5. Passwordless Authentication (FIDO2/WebAuthn)](#5-passwordless-authentication-fido2webauthn)
- [6. OAuth 2.0 & OpenID Connect](#6-oauth-20--openid-connect)
- [7. Session Management](#7-session-management)
- [8. Account Security](#8-account-security)
- [9. Token Lifecycle Management](#9-token-lifecycle-management)
- [10. Identity Provider Integration](#10-identity-provider-integration)

---

## 1. Authentication Architecture

### 1.1 Authentication Flow

```
┌─────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
│ Angular  │────▸│  Caddy   │────▸│ ASP.NET   │────▸│PostgreSQL│
│  SPA     │◂────│ (Proxy)  │◂────│ Core API  │◂────│ Identity │
└─────────┘     └──────────┘     └───────────┘     └──────────┘
     │                                   │
     │  1. Login Request                 │  4. Validate Credentials
     │  2. CSRF Token in Header          │  5. Generate JWT + Refresh Token
     │  3. Credentials in Body           │  6. Set HttpOnly Cookies
     │                                   │
     │  7. JWT in HttpOnly Cookie ◂──────│
     │  8. CSRF Token in Response        │
     │                                   │
     │  Subsequent Requests:             │
     │  9. Cookie auto-attached          │
     │ 10. CSRF Header manually set      │
```

### 1.2 Authentication Methods — Sicherheitsstufen

```
Stufe 1 (Standard):
  └── Username/Password + TOTP MFA

Stufe 2 (Government):
  └── Username/Password + FIDO2 Hardware Key
  
Stufe 3 (Banking/Critical):
  └── FIDO2 Passwordless + Device Binding + Risk-Based Auth
  
Stufe 4 (Admin/Emergency):
  └── mTLS Client Certificate + FIDO2 + IP Restriction + Approval Workflow
```

---

## 2. ASP.NET Core Identity Setup

### 2.1 Identity Configuration

```csharp
// Program.cs
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    // Password Policy (Government-Grade)
    options.Password.RequiredLength = 14;
    options.Password.RequiredUniqueChars = 6;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    
    // Lockout Policy
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
    
    // User Settings
    options.User.RequireUniqueEmail = true;
    options.User.AllowedUserNameCharacters = 
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
    
    // Sign-In Settings
    options.SignIn.RequireConfirmedEmail = true;
    options.SignIn.RequireConfirmedAccount = true;
    
    // Token Settings
    options.Tokens.EmailConfirmationTokenProvider = "Email";
    options.Tokens.PasswordResetTokenProvider = "Email";
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders()
.AddTokenProvider<EmailTokenProvider<ApplicationUser>>("Email");

// Custom Password Validator
builder.Services.AddTransient<IPasswordValidator<ApplicationUser>, StrongPasswordValidator>();
```

### 2.2 Custom User Model

```csharp
public class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public string? LastLoginIp { get; set; }
    public int FailedLoginAttempts { get; set; }
    public bool MfaEnabled { get; set; }
    public string? MfaSecret { get; set; } // Encrypted
    public bool Fido2Enabled { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Device Tracking
    public ICollection<UserDevice> TrustedDevices { get; set; } = [];
    
    // Refresh Tokens
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    
    // FIDO2 Credentials
    public ICollection<Fido2Credential> Fido2Credentials { get; set; } = [];
}

public class RefreshToken
{
    public Guid Id { get; set; }
    public string Token { get; set; } = string.Empty;  // Hashed
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByToken { get; set; }
    public string CreatedByIp { get; set; } = string.Empty;
    public string? RevokedByIp { get; set; }
    public string? DeviceFingerprint { get; set; }
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt != null;
    public bool IsActive => !IsRevoked && !IsExpired;
}
```

### 2.3 Strong Password Validator

```csharp
public class StrongPasswordValidator : IPasswordValidator<ApplicationUser>
{
    // Top 10.000 häufigste Passwörter (aus SecLists)
    private static readonly HashSet<string> CommonPasswords = LoadCommonPasswords();
    
    public async Task<IdentityResult> ValidateAsync(
        UserManager<ApplicationUser> manager,
        ApplicationUser user,
        string? password)
    {
        var errors = new List<IdentityError>();
        
        if (string.IsNullOrEmpty(password)) 
            return IdentityResult.Failed(new IdentityError 
                { Description = "Password is required" });
        
        // Keine häufigen Passwörter
        if (CommonPasswords.Contains(password.ToLowerInvariant()))
        {
            errors.Add(new IdentityError { Description = "This password is too common" });
        }
        
        // Kein Username im Passwort
        if (!string.IsNullOrEmpty(user.UserName) && 
            password.Contains(user.UserName, StringComparison.OrdinalIgnoreCase))
        {
            errors.Add(new IdentityError { Description = "Password cannot contain username" });
        }
        
        // Kein Email im Passwort
        if (!string.IsNullOrEmpty(user.Email) && 
            password.Contains(user.Email.Split('@')[0], StringComparison.OrdinalIgnoreCase))
        {
            errors.Add(new IdentityError { Description = "Password cannot contain email" });
        }
        
        // Keine Wiederholungen (aaa, 111)
        if (HasRepeatingCharacters(password, 3))
        {
            errors.Add(new IdentityError { Description = "Password cannot have repeating characters" });
        }
        
        // Keine sequentiellen Zeichen (abc, 123)
        if (HasSequentialCharacters(password, 4))
        {
            errors.Add(new IdentityError { Description = "Password cannot have sequential characters" });
        }
        
        // Entropie-Check
        if (CalculateEntropy(password) < 50)
        {
            errors.Add(new IdentityError { Description = "Password is not complex enough" });
        }
        
        return errors.Count > 0 
            ? IdentityResult.Failed(errors.ToArray()) 
            : IdentityResult.Success;
    }
    
    private static bool HasRepeatingCharacters(string input, int maxRepeat) =>
        Regex.IsMatch(input, $@"(.)\1{{{maxRepeat - 1},}}");
    
    private static bool HasSequentialCharacters(string input, int length)
    {
        for (int i = 0; i <= input.Length - length; i++)
        {
            bool sequential = true;
            for (int j = 1; j < length; j++)
            {
                if (input[i + j] - input[i + j - 1] != 1)
                {
                    sequential = false;
                    break;
                }
            }
            if (sequential) return true;
        }
        return false;
    }
    
    private static double CalculateEntropy(string password)
    {
        var charsetSize = 0;
        if (password.Any(char.IsLower)) charsetSize += 26;
        if (password.Any(char.IsUpper)) charsetSize += 26;
        if (password.Any(char.IsDigit)) charsetSize += 10;
        if (password.Any(c => !char.IsLetterOrDigit(c))) charsetSize += 32;
        return password.Length * Math.Log2(charsetSize);
    }
    
    private static HashSet<string> LoadCommonPasswords()
    {
        // Lade aus embedded resource
        var assembly = typeof(StrongPasswordValidator).Assembly;
        using var stream = assembly.GetManifestResourceStream("common-passwords.txt");
        if (stream is null) return [];
        using var reader = new StreamReader(stream);
        var passwords = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        string? line;
        while ((line = reader.ReadLine()) is not null)
        {
            passwords.Add(line.Trim());
        }
        return passwords;
    }
}
```

---

## 3. JWT Token Security

### 3.1 Asymmetric JWT (RS512)

```csharp
// JWT Configuration
builder.Services.AddSingleton<RsaSecurityKey>(sp =>
{
    // RSA Key aus Datei laden (nicht im Code!)
    var rsaKey = RSA.Create();
    var keyPem = File.ReadAllText("/run/secrets/jwt-private-key.pem");
    rsaKey.ImportFromPem(keyPem);
    return new RsaSecurityKey(rsaKey);
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var rsaKey = builder.Services.BuildServiceProvider()
            .GetRequiredService<RsaSecurityKey>();
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = rsaKey,
            
            ValidateIssuer = true,
            ValidIssuer = "https://api.example.com",
            
            ValidateAudience = true,
            ValidAudience = "https://app.example.com",
            
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30), // Minimal!
            
            // Algorithm Enforcement
            ValidAlgorithms = ["RS512"],
            
            RequireExpirationTime = true,
            RequireSignedTokens = true,
        };
        
        // JWT aus Cookie lesen (nicht aus Header)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies["access_token"];
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                // Token Blacklist prüfen
                var tokenBlacklist = context.HttpContext.RequestServices
                    .GetRequiredService<ITokenBlacklistService>();
                // Log but don't expose details
                return Task.CompletedTask;
            }
        };
    });
```

### 3.2 Token Generation

```csharp
public class TokenService : ITokenService
{
    private readonly RsaSecurityKey _rsaKey;
    private readonly IConfiguration _config;
    
    public TokenService(RsaSecurityKey rsaKey, IConfiguration config)
    {
        _rsaKey = rsaKey;
        _config = config;
    }
    
    public (string AccessToken, string RefreshToken) GenerateTokenPair(
        ApplicationUser user, 
        IList<string> roles)
    {
        var accessToken = GenerateAccessToken(user, roles);
        var refreshToken = GenerateRefreshToken();
        return (accessToken, refreshToken);
    }
    
    private string GenerateAccessToken(ApplicationUser user, IList<string> roles)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email!),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat, 
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), 
                ClaimValueTypes.Integer64),
            new("mfa_verified", user.MfaEnabled.ToString().ToLower()),
        };
        
        // Rollen als Claims
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        
        var credentials = new SigningCredentials(_rsaKey, SecurityAlgorithms.RsaSha512);
        
        var token = new JwtSecurityToken(
            issuer: "https://api.example.com",
            audience: "https://app.example.com",
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(15), // Kurze Lebensdauer!
            signingCredentials: credentials
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    
    private static string GenerateRefreshToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(randomBytes);
    }
}
```

### 3.3 Token Blacklist Service

```csharp
public interface ITokenBlacklistService
{
    Task BlacklistTokenAsync(string jti, DateTime expiresAt);
    Task<bool> IsBlacklistedAsync(string jti);
}

public class TokenBlacklistService : ITokenBlacklistService
{
    private readonly IDistributedCache _cache;
    
    public TokenBlacklistService(IDistributedCache cache)
    {
        _cache = cache;
    }
    
    public async Task BlacklistTokenAsync(string jti, DateTime expiresAt)
    {
        var ttl = expiresAt - DateTime.UtcNow;
        if (ttl <= TimeSpan.Zero) return;
        
        await _cache.SetStringAsync(
            $"blacklist:{jti}", 
            "revoked",
            new DistributedCacheEntryOptions
            {
                AbsoluteExpiration = expiresAt
            });
    }
    
    public async Task<bool> IsBlacklistedAsync(string jti)
    {
        var result = await _cache.GetStringAsync($"blacklist:{jti}");
        return result is not null;
    }
}
```

---

## 4. Multi-Factor Authentication (MFA)

### 4.1 TOTP Setup

```csharp
[Authorize]
[ApiController]
[Route("api/auth/mfa")]
public class MfaController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    
    [HttpPost("enable")]
    public async Task<IActionResult> EnableMfa()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();
        
        // TOTP Secret generieren
        var key = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
        {
            await _userManager.ResetAuthenticatorKeyAsync(user);
            key = await _userManager.GetAuthenticatorKeyAsync(user);
        }
        
        // QR-Code URI
        var uri = $"otpauth://totp/MyApp:{user.Email}?secret={key}&issuer=MyApp&algorithm=SHA1&digits=6&period=30";
        
        // Recovery Codes generieren
        var recoveryCodes = await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);
        
        return Ok(new
        {
            SharedKey = key,
            AuthenticatorUri = uri,
            RecoveryCodes = recoveryCodes
        });
    }
    
    [HttpPost("verify")]
    public async Task<IActionResult> VerifyMfa([FromBody] MfaVerifyDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();
        
        var isValid = await _userManager.VerifyTwoFactorTokenAsync(
            user,
            _userManager.Options.Tokens.AuthenticatorTokenProvider,
            dto.Code);
        
        if (!isValid)
        {
            return BadRequest(new { Error = "Invalid verification code" });
        }
        
        await _userManager.SetTwoFactorEnabledAsync(user, true);
        
        return Ok(new { Message = "MFA enabled successfully" });
    }
}
```

### 4.2 Login mit MFA

```csharp
[HttpPost("login")]
[RateLimit("login")]
public async Task<IActionResult> Login([FromBody] LoginDto dto)
{
    var user = await _userManager.FindByEmailAsync(dto.Email);
    
    // Constant-time comparison — kein username enumeration
    if (user is null || !user.IsActive)
    {
        // Gleiche Verzögerung wie bei echtem Login
        await Task.Delay(Random.Shared.Next(100, 300));
        return Unauthorized(new { Error = "Invalid credentials" });
    }
    
    // Account Lockout prüfen
    if (await _userManager.IsLockedOutAsync(user))
    {
        return StatusCode(429, new { Error = "Account temporarily locked" });
    }
    
    var result = await _userManager.CheckPasswordAsync(user, dto.Password);
    if (!result)
    {
        await _userManager.AccessFailedAsync(user);
        return Unauthorized(new { Error = "Invalid credentials" });
    }
    
    // MFA erforderlich?
    if (await _userManager.GetTwoFactorEnabledAsync(user))
    {
        // Temporäres MFA-Token
        var mfaToken = GenerateMfaToken(user.Id);
        
        return Ok(new
        {
            RequiresMfa = true,
            MfaToken = mfaToken,
            MfaMethods = GetAvailableMfaMethods(user)
        });
    }
    
    // Kein MFA — direkt einloggen
    return await CompleteLogin(user);
}

[HttpPost("login/mfa")]
[RateLimit("login")]
public async Task<IActionResult> LoginMfa([FromBody] MfaLoginDto dto)
{
    var userId = ValidateMfaToken(dto.MfaToken);
    if (userId == Guid.Empty) return Unauthorized();
    
    var user = await _userManager.FindByIdAsync(userId.ToString());
    if (user is null) return Unauthorized();
    
    // TOTP Code validieren
    var isValid = await _userManager.VerifyTwoFactorTokenAsync(
        user,
        _userManager.Options.Tokens.AuthenticatorTokenProvider,
        dto.Code);
    
    // Oder Recovery Code
    if (!isValid && dto.Code.Length == 8)
    {
        var redeemResult = await _userManager.RedeemTwoFactorRecoveryCodeAsync(user, dto.Code);
        isValid = redeemResult.Succeeded;
    }
    
    if (!isValid)
    {
        return Unauthorized(new { Error = "Invalid MFA code" });
    }
    
    return await CompleteLogin(user, mfaVerified: true);
}

private async Task<IActionResult> CompleteLogin(ApplicationUser user, bool mfaVerified = false)
{
    var roles = await _userManager.GetRolesAsync(user);
    var (accessToken, refreshToken) = _tokenService.GenerateTokenPair(user, roles);
    
    // Refresh Token in DB speichern (gehasht)
    var hashedRefreshToken = HashToken(refreshToken);
    user.RefreshTokens.Add(new RefreshToken
    {
        Token = hashedRefreshToken,
        CreatedAt = DateTime.UtcNow,
        ExpiresAt = DateTime.UtcNow.AddDays(7),
        CreatedByIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        DeviceFingerprint = Request.Headers["X-Device-Fingerprint"].FirstOrDefault()
    });
    
    user.LastLoginAt = DateTime.UtcNow;
    user.LastLoginIp = HttpContext.Connection.RemoteIpAddress?.ToString();
    await _userManager.UpdateAsync(user);
    
    // Tokens als HttpOnly Cookies setzen
    SetTokenCookies(accessToken, refreshToken);
    
    return Ok(new
    {
        User = new { user.Email, user.FirstName, user.LastName, Roles = roles },
        ExpiresAt = DateTime.UtcNow.AddMinutes(15).ToString("O"),
        MfaVerified = mfaVerified
    });
}

private void SetTokenCookies(string accessToken, string refreshToken)
{
    Response.Cookies.Append("access_token", accessToken, new CookieOptions
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        MaxAge = TimeSpan.FromMinutes(15),
        Path = "/api"
    });
    
    Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        MaxAge = TimeSpan.FromDays(7),
        Path = "/api/auth/refresh"  // Nur für Refresh-Endpoint
    });
}
```

---

## 5. Passwordless Authentication (FIDO2/WebAuthn)

### 5.1 FIDO2 Server-Setup

```csharp
// NuGet: Fido2.AspNet
builder.Services.AddFido2(options =>
{
    options.ServerDomain = "app.example.com";
    options.ServerName = "MyApp";
    options.Origins = new HashSet<string> { "https://app.example.com" };
    options.TimestampDriftTolerance = 300000; // 5 Minuten
});
```

### 5.2 FIDO2 Registration

```csharp
[Authorize]
[Route("api/auth/fido2")]
[ApiController]
public class Fido2Controller : ControllerBase
{
    private readonly IFido2 _fido2;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _db;
    
    [HttpPost("register/options")]
    public async Task<IActionResult> GetRegistrationOptions()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();
        
        // Existierende Credentials
        var existingKeys = await _db.Fido2Credentials
            .Where(c => c.UserId == user.Id)
            .Select(c => new PublicKeyCredentialDescriptor(c.CredentialId))
            .ToListAsync();
        
        var options = _fido2.RequestNewCredential(
            new Fido2User
            {
                Id = user.Id.ToByteArray(),
                Name = user.Email!,
                DisplayName = $"{user.FirstName} {user.LastName}"
            },
            existingKeys,
            new AuthenticatorSelection
            {
                AuthenticatorAttachment = AuthenticatorAttachment.CrossPlatform,
                UserVerification = UserVerificationRequirement.Required,
                ResidentKey = ResidentKeyRequirement.Required
            },
            AttestationConveyancePreference.Direct
        );
        
        // Options in Session speichern für Verification
        HttpContext.Session.SetString("fido2.registration", options.ToJson());
        
        return Ok(options);
    }
    
    [HttpPost("register/complete")]
    public async Task<IActionResult> CompleteRegistration(
        [FromBody] AuthenticatorAttestationRawResponse attestation)
    {
        var optionsJson = HttpContext.Session.GetString("fido2.registration");
        if (optionsJson is null) return BadRequest();
        
        var options = CredentialCreateOptions.FromJson(optionsJson);
        
        var result = await _fido2.MakeNewCredentialAsync(
            attestation, options, 
            async (args, _) => 
            {
                // Prüfe ob Credential ID schon existiert
                var exists = await _db.Fido2Credentials
                    .AnyAsync(c => c.CredentialId == args.CredentialId);
                return !exists;
            });
        
        if (result.Status != "ok") return BadRequest(result.ErrorMessage);
        
        var user = await _userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();
        
        // Credential speichern
        _db.Fido2Credentials.Add(new Fido2Credential
        {
            UserId = user.Id,
            CredentialId = result.Result!.Id,
            PublicKey = result.Result.PublicKey,
            SignCount = result.Result.Counter,
            CredType = result.Result.Type.ToString(),
            AaGuid = result.Result.AaGuid,
            RegisteredAt = DateTime.UtcNow,
            DeviceName = "Security Key"
        });
        
        user.Fido2Enabled = true;
        await _db.SaveChangesAsync();
        
        return Ok(new { Message = "FIDO2 key registered successfully" });
    }
}
```

### 5.3 FIDO2 Angular Client

```typescript
@Injectable({ providedIn: 'root' })
export class Fido2Service {
  private http = inject(HttpClient);
  
  async register(): Promise<void> {
    // 1. Options vom Server holen
    const options = await firstValueFrom(
      this.http.post<PublicKeyCredentialCreationOptions>(
        '/api/auth/fido2/register/options', null, { withCredentials: true }
      )
    );
    
    // 2. Browser-API aufrufen
    const credential = await navigator.credentials.create({
      publicKey: {
        ...options,
        challenge: this.base64ToBuffer(options.challenge as any),
        user: {
          ...options.user,
          id: this.base64ToBuffer(options.user.id as any)
        },
        excludeCredentials: options.excludeCredentials?.map(c => ({
          ...c,
          id: this.base64ToBuffer(c.id as any)
        }))
      }
    }) as PublicKeyCredential;
    
    // 3. An Server senden
    const attestation = credential.response as AuthenticatorAttestationResponse;
    await firstValueFrom(
      this.http.post('/api/auth/fido2/register/complete', {
        id: credential.id,
        rawId: this.bufferToBase64(credential.rawId),
        response: {
          attestationObject: this.bufferToBase64(attestation.attestationObject),
          clientDataJSON: this.bufferToBase64(attestation.clientDataJSON)
        },
        type: credential.type
      }, { withCredentials: true })
    );
  }
  
  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  private bufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
```

---

## 6. OAuth 2.0 & OpenID Connect

### 6.1 External Provider Integration

```csharp
// Azure AD / Microsoft Entra ID
builder.Services.AddAuthentication()
    .AddOpenIdConnect("AzureAD", options =>
    {
        options.Authority = "https://login.microsoftonline.com/{tenant-id}/v2.0";
        options.ClientId = builder.Configuration["AzureAd:ClientId"]!;
        options.ClientSecret = builder.Configuration["AzureAd:ClientSecret"]!;
        options.ResponseType = OpenIdConnectResponseType.Code;
        options.SaveTokens = false; // Tokens nicht im Cookie speichern
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("email");
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            NameClaimType = "preferred_username",
            RoleClaimType = "roles"
        };
        
        options.Events = new OpenIdConnectEvents
        {
            OnTokenValidated = async context =>
            {
                // User in lokale DB synchronisieren
                var userService = context.HttpContext.RequestServices
                    .GetRequiredService<IUserSyncService>();
                await userService.SyncExternalUser(context.Principal!);
            },
            OnRemoteFailure = context =>
            {
                context.Response.Redirect("/login?error=external_auth_failed");
                context.HandleResponse();
                return Task.CompletedTask;
            }
        };
    });
```

---

## 7. Session Management

### 7.1 Distributed Session

```csharp
// Redis Session Store
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "session:";
});

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(15);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.Name = "__Host-Session"; // Cookie Prefix für extra Sicherheit
});
```

### 7.2 Concurrent Session Control

```csharp
public class ConcurrentSessionMiddleware
{
    private readonly RequestDelegate _next;
    
    public async Task InvokeAsync(HttpContext context, IDistributedCache cache)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await _next(context);
            return;
        }
        
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId is null) { await _next(context); return; }
        
        var sessionId = context.Request.Cookies["session_id"];
        var activeSession = await cache.GetStringAsync($"active_session:{userId}");
        
        // Nur eine aktive Session pro Benutzer
        if (activeSession is not null && activeSession != sessionId)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new 
            { 
                Error = "Session expired — logged in from another device" 
            });
            return;
        }
        
        await _next(context);
    }
}
```

---

## 8. Account Security

### 8.1 Brute-Force Protection

```csharp
public class BruteForceProtectionService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<BruteForceProtectionService> _logger;
    
    // Progressive Delays
    private static readonly int[] DelaySeconds = [0, 1, 2, 4, 8, 16, 30, 60, 120, 300];
    
    public async Task<bool> IsBlockedAsync(string identifier)
    {
        var blockKey = $"blocked:{identifier}";
        return await _cache.GetStringAsync(blockKey) is not null;
    }
    
    public async Task RecordFailedAttemptAsync(string identifier, string ip)
    {
        var key = $"failed:{identifier}";
        var attempts = await GetAttemptsAsync(key);
        attempts++;
        
        await _cache.SetStringAsync(key, attempts.ToString(),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
            });
        
        // IP-basiertes Blocking
        var ipKey = $"failed_ip:{ip}";
        var ipAttempts = await GetAttemptsAsync(ipKey);
        ipAttempts++;
        
        await _cache.SetStringAsync(ipKey, ipAttempts.ToString(),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
            });
        
        // Blockieren nach zu vielen Versuchen
        if (attempts >= 10 || ipAttempts >= 50)
        {
            var blockDuration = TimeSpan.FromMinutes(30);
            await _cache.SetStringAsync($"blocked:{identifier}", "true",
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = blockDuration
                });
            
            _logger.LogWarning(
                "Account {Identifier} blocked after {Attempts} failed attempts from IP {Ip}",
                identifier, attempts, ip);
        }
    }
    
    public int GetDelaySeconds(int attemptCount)
    {
        var index = Math.Min(attemptCount, DelaySeconds.Length - 1);
        return DelaySeconds[index];
    }
    
    private async Task<int> GetAttemptsAsync(string key)
    {
        var value = await _cache.GetStringAsync(key);
        return int.TryParse(value, out var attempts) ? attempts : 0;
    }
}
```

---

## 9. Token Lifecycle Management

### 9.1 Token Refresh mit Rotation

```csharp
[HttpPost("refresh")]
public async Task<IActionResult> RefreshToken()
{
    var refreshTokenValue = Request.Cookies["refresh_token"];
    if (string.IsNullOrEmpty(refreshTokenValue))
        return Unauthorized();
    
    var hashedToken = HashToken(refreshTokenValue);
    
    // Token in DB suchen
    var storedToken = await _db.RefreshTokens
        .Include(t => t.User)
        .FirstOrDefaultAsync(t => t.Token == hashedToken);
    
    if (storedToken is null || !storedToken.IsActive)
    {
        // Token Reuse Detection!
        if (storedToken?.IsRevoked == true)
        {
            // Alle Tokens des Users revoken (Kompromittierung!)
            await RevokeAllUserTokens(storedToken.User.Id);
            _logger.LogCritical(
                "Refresh token reuse detected for user {UserId}!", 
                storedToken.User.Id);
        }
        return Unauthorized();
    }
    
    // Alten Token revoken
    storedToken.RevokedAt = DateTime.UtcNow;
    storedToken.RevokedByIp = HttpContext.Connection.RemoteIpAddress?.ToString();
    
    // Neue Tokens generieren (Rotation)
    var roles = await _userManager.GetRolesAsync(storedToken.User);
    var (newAccessToken, newRefreshToken) = _tokenService.GenerateTokenPair(
        storedToken.User, roles);
    
    // Neuen Refresh Token speichern
    storedToken.ReplacedByToken = HashToken(newRefreshToken);
    _db.RefreshTokens.Add(new RefreshToken
    {
        Token = HashToken(newRefreshToken),
        UserId = storedToken.User.Id,
        CreatedAt = DateTime.UtcNow,
        ExpiresAt = DateTime.UtcNow.AddDays(7),
        CreatedByIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"
    });
    
    await _db.SaveChangesAsync();
    
    SetTokenCookies(newAccessToken, newRefreshToken);
    
    return Ok(new { ExpiresAt = DateTime.UtcNow.AddMinutes(15).ToString("O") });
}
```

---

## 10. Identity Provider Integration

### 10.1 Security-Checkliste Auth

```yaml
Token Security:
  ✅ JWT asymmetrisch signiert (RS512)
  ✅ Access Token Lifetime ≤ 15 Minuten
  ✅ Refresh Token Rotation (jedes Refresh = neuer Token)
  ✅ Token Reuse Detection (alle Tokens revoken)
  ✅ Tokens in HttpOnly Secure Cookies
  ✅ Token Blacklist (Redis/Distributed Cache)
  ✅ Algorithm Enforcement (kein "none", kein HS256)
  ✅ ClockSkew ≤ 30 Sekunden

Password Security:
  ✅ Mindestlänge 14 Zeichen
  ✅ Häufige Passwörter blockiert (Top 10.000)
  ✅ Keine Username/Email-Bestandteile
  ✅ Keine Wiederholungen/Sequenzen
  ✅ Entropie-Check (≥ 50 Bit)
  ✅ Argon2id Hashing (via Identity)

MFA:
  ✅ TOTP (RFC 6238) mit 6-Digit, 30s Period
  ✅ 10 Recovery Codes bei Setup
  ✅ FIDO2/WebAuthn (Hardware Keys)
  ✅ MFA erforderlich für Admin/Banking

Session:
  ✅ Session Timeout 15 Minuten Inaktivität
  ✅ Concurrent Session Control (1 Session)
  ✅ Session Invalidation bei Passwortänderung
  ✅ Secure Session Cookie (__Host- Prefix)

Account Protection:
  ✅ Progressive Delays bei Failed Login
  ✅ Account Lockout (5 Versuche / 30 Min)
  ✅ IP-basiertes Rate Limiting (50 / Stunde)
  ✅ No Username Enumeration (konstante Antwortzeit)
```

---

## Weiterführende Dokumente

| Nächstes Dokument | Thema |
|-------------------|-------|
| [07 — Angular Security](07-angular-admin-panel-security.md) | Frontend Token Handling |
| [09 — Cryptography](09-cryptography-data-protection.md) | Verschlüsselung & Key Management |
| [06 — API Security](06-aspnet-core-api-security.md) | API Authorization Policies |
