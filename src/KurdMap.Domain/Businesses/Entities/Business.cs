using KurdMap.Domain.Businesses.ValueObjects;
using KurdMap.Domain.Common;
using KurdMap.Domain.Enums;

namespace KurdMap.Domain.Businesses.Entities;

public class Business : AuditableEntity
{
    public MultilingualText Name { get; private set; } = null!;
    public string Slug { get; private set; } = string.Empty;
    public MultilingualText Description { get; private set; } = null!;
    public Guid CategoryId { get; private set; }
    public Address Address { get; private set; } = null!;
    public Coordinates Location { get; private set; } = null!;
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public string? Website { get; private set; }
    public OpeningHours? Hours { get; private set; }
    public BusinessStatus Status { get; private set; }
    public bool IsVerified { get; private set; }
    public bool IsFeatured { get; private set; }
    public Guid? OwnerId { get; private set; }

    // Discount / Promotion
    public int? DiscountPercentage { get; private set; }
    public MultilingualText? DiscountDescription { get; private set; }
    public DateTime? DiscountStartDate { get; private set; }
    public DateTime? DiscountEndDate { get; private set; }
    public bool HasActiveDiscount => DiscountPercentage.HasValue
        && DiscountPercentage > 0
        && (!DiscountStartDate.HasValue || DiscountStartDate <= DateTime.UtcNow)
        && (!DiscountEndDate.HasValue || DiscountEndDate > DateTime.UtcNow);

    private readonly List<BusinessImage> _images = [];
    public IReadOnlyCollection<BusinessImage> Images => _images.AsReadOnly();

    private readonly List<BusinessService> _services = [];
    public IReadOnlyCollection<BusinessService> Services => _services.AsReadOnly();

    private readonly List<MenuItem> _menuItems = [];
    public IReadOnlyCollection<MenuItem> MenuItems => _menuItems.AsReadOnly();

    private readonly List<IDomainEvent> _domainEvents = [];
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    private Business() { }

    public static Business Create(
        MultilingualText name,
        string slug,
        MultilingualText description,
        Guid categoryId,
        Address address,
        Coordinates location)
    {
        var business = new Business
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = slug.ToLowerInvariant(),
            Description = description,
            CategoryId = categoryId,
            Address = address,
            Location = location,
            Status = BusinessStatus.Pending,
            IsVerified = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        business._domainEvents.Add(new Events.BusinessCreatedEvent(business.Id));
        return business;
    }

    public void Update(
        MultilingualText name,
        MultilingualText description,
        Guid categoryId,
        Address address,
        Coordinates location)
    {
        Name = name;
        Description = description;
        CategoryId = categoryId;
        Address = address;
        Location = location;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetContact(string? phone, string? email, string? website)
    {
        Phone = phone;
        Email = email;
        Website = website;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetOpeningHours(OpeningHours hours)
    {
        Hours = hours;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetOwner(Guid ownerId)
    {
        OwnerId = ownerId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Verify()
    {
        if (IsVerified) return;
        IsVerified = true;
        Status = BusinessStatus.Active;
        UpdatedAt = DateTime.UtcNow;
        _domainEvents.Add(new Events.BusinessVerifiedEvent(Id));
    }

    public void SetFeatured(bool featured)
    {
        IsFeatured = featured;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetDiscount(int percentage, MultilingualText? description, DateTime? startDate, DateTime? endDate)
    {
        if (percentage < 1 || percentage > 100)
            throw new DomainException("Discount percentage must be between 1 and 100.");
        if (endDate.HasValue && startDate.HasValue && endDate <= startDate)
            throw new DomainException("Discount end date must be after start date.");

        DiscountPercentage = percentage;
        DiscountDescription = description;
        DiscountStartDate = startDate;
        DiscountEndDate = endDate;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ClearDiscount()
    {
        DiscountPercentage = null;
        DiscountDescription = null;
        DiscountStartDate = null;
        DiscountEndDate = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        Status = BusinessStatus.Deactivated;
        UpdatedAt = DateTime.UtcNow;
        _domainEvents.Add(new Events.BusinessDeactivatedEvent(Id));
    }

    public void SoftDelete()
    {
        Status = BusinessStatus.Deactivated;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddImage(string url, string? altText, bool isPrimary = false)
    {
        if (isPrimary)
            foreach (var img in _images) img.SetNotPrimary();

        _images.Add(BusinessImage.Create(Id, url, altText, isPrimary, _images.Count));
    }

    public void RemoveImage(Guid imageId)
    {
        var image = _images.FirstOrDefault(i => i.Id == imageId);
        if (image is not null)
            _images.Remove(image);
    }

    public void SetPrimaryImage(Guid imageId)
    {
        foreach (var img in _images)
            img.SetNotPrimary();

        var image = _images.FirstOrDefault(i => i.Id == imageId);
        image?.SetAsPrimary();
    }

    public void AddMenuItem(MenuItem menuItem)
    {
        _menuItems.Add(menuItem);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveMenuItem(MenuItem menuItem)
    {
        _menuItems.Remove(menuItem);
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddService(BusinessService service)
    {
        _services.Add(service);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveService(BusinessService service)
    {
        _services.Remove(service);
        UpdatedAt = DateTime.UtcNow;
    }

    public void ClearDomainEvents() => _domainEvents.Clear();
}
