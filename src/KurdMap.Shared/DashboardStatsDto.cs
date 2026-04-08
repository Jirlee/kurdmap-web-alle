using System.Collections.Generic;

namespace KurdMap.Shared
{
    public class DashboardStatsDto
    {
        public int TotalBusinesses { get; set; }
        public int ActiveBusinesses { get; set; }
        public int PendingBusinesses { get; set; }
        public int RejectedBusinesses { get; set; }
        public int DeactivatedBusinesses { get; set; }
        public int TotalCategories { get; set; }
        public int TotalCities { get; set; }
        public List<BusinessSummaryDto> RecentBusinesses { get; set; } = new();
    }
}
