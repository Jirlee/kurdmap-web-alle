using KurdMap.Domain.Businesses.Entities;
using KurdMap.Domain.Businesses.ValueObjects;

namespace KurdMap.Application.Businesses.DTOs;

public static class BusinessMappings
{
    public static MultilingualTextDto ToDto(this MultilingualText text)
        => new(text.Ku, text.Kmr, text.De, text.En);

    public static MultilingualTextDto? ToDtoOrNull(this MultilingualText? text)
        => text is null ? null : new(text.Ku, text.Kmr, text.De, text.En);

    public static BusinessDetailDto ToDetailDto(this Business business)
        => new(
            Id: business.Id,
            Slug: business.Slug,
            Name: business.Name.ToDto(),
            Description: business.Description.ToDto(),
            CategoryId: business.CategoryId,
            Street: business.Address.Street,
            PostalCode: business.Address.PostalCode,
            CityId: business.Address.CityId,
            Latitude: business.Location.Latitude,
            Longitude: business.Location.Longitude,
            Phone: business.Phone,
            Email: business.Email,
            Website: business.Website,
            Hours: business.Hours?.ToDto(),
            Status: business.Status,
            IsVerified: business.IsVerified,
            IsFeatured: business.IsFeatured,
            OwnerId: business.OwnerId,
            CreatedAt: business.CreatedAt,
            UpdatedAt: business.UpdatedAt,
            Images: business.Images.Select(i => i.ToDto()).ToList(),
            Services: business.Services.Select(s => s.ToDto()).ToList(),
            MenuItems: business.MenuItems.Select(m => m.ToDto()).ToList(),
            DiscountPercentage: business.DiscountPercentage,
            DiscountDescription: business.DiscountDescription.ToDtoOrNull(),
            DiscountStartDate: business.DiscountStartDate,
            DiscountEndDate: business.DiscountEndDate,
            HasActiveDiscount: business.HasActiveDiscount);

    public static BusinessSummaryDto ToSummaryDto(this Business business)
        => new(
            Id: business.Id,
            Slug: business.Slug,
            Name: business.Name.ToDto(),
            CategoryId: business.CategoryId,
            CategorySlug: null,
            Street: business.Address.Street,
            PostalCode: business.Address.PostalCode,
            Latitude: business.Location.Latitude,
            Longitude: business.Location.Longitude,
            Phone: business.Phone,
            Status: business.Status,
            IsVerified: business.IsVerified,
            IsFeatured: business.IsFeatured,
            PrimaryImageUrl: business.Images.FirstOrDefault(i => i.IsPrimary)?.Url
                ?? business.Images.FirstOrDefault()?.Url,
            DiscountPercentage: business.DiscountPercentage,
            DiscountDescription: business.DiscountDescription.ToDtoOrNull(),
            HasActiveDiscount: business.HasActiveDiscount);

    public static BusinessImageDto ToDto(this BusinessImage image)
        => new(image.Id, image.Url, image.AltText, image.IsPrimary, image.SortOrder);

    public static BusinessServiceDto ToDto(this BusinessService service)
        => new(service.Id, service.Name.ToDto(), service.Description.ToDtoOrNull(), service.Price, service.SortOrder);

    public static MenuItemDto ToDto(this MenuItem item)
        => new(item.Id, item.Name.ToDto(), item.Description.ToDtoOrNull(), item.Price, item.ImageUrl, item.SortOrder);

    public static OpeningHoursDto ToDto(this OpeningHours hours)
        => new(
            Monday: hours.Monday.ToDto(),
            Tuesday: hours.Tuesday.ToDto(),
            Wednesday: hours.Wednesday.ToDto(),
            Thursday: hours.Thursday.ToDto(),
            Friday: hours.Friday.ToDto(),
            Saturday: hours.Saturday.ToDto(),
            Sunday: hours.Sunday.ToDto());

    private static DayScheduleDto ToDto(this DaySchedule day)
        => new(day.Open, day.Close, day.Closed);
}
