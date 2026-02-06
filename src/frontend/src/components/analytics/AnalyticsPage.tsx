import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetUserVisitEntries } from '../../hooks/useQueries';
import { calculateMonthlyTotals, calculateYearlyTotals } from '../../utils/visitEntryAnalytics';
import SpendingChart from './SpendingChart';
import { TrendingUp, Calendar, Loader2, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const { data: entries, isLoading, error } = useGetUserVisitEntries();

  const monthlyTotals = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    return calculateMonthlyTotals(entries);
  }, [entries]);

  const yearlyTotals = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    return calculateYearlyTotals(entries);
  }, [entries]);

  const overallTotals = useMemo(() => {
    if (!entries || entries.length === 0) {
      return { hospitalRs: 0, medicineRs: 0, total: 0 };
    }
    return entries.reduce(
      (acc, entry) => ({
        hospitalRs: acc.hospitalRs + Number(entry.hospitalRs),
        medicineRs: acc.medicineRs + Number(entry.medicineRs),
        total: acc.total + Number(entry.hospitalRs) + Number(entry.medicineRs),
      }),
      { hospitalRs: 0, medicineRs: 0, total: 0 }
    );
  }, [entries]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading analytics...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-sm text-destructive">Failed to load analytics. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">No entries yet</h3>
                <p className="text-sm text-muted-foreground">
                  Add entries to see analytics and spending trends
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          Analytics
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your medical expenses and spending trends
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Hospital Charges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              Rs {overallTotals.hospitalRs.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Medicine Charges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              Rs {overallTotals.medicineRs.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              Rs {overallTotals.total.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          <TabsTrigger value="yearly">Yearly View</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6 mt-6">
          <SpendingChart
            data={monthlyTotals}
            title="Monthly Spending Trends"
            description="Hospital and medicine charges by month"
          />

          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
              <CardDescription>Detailed monthly totals for hospital and medicine charges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyTotals.map((month) => (
                  <div key={month.period}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{month.label}</span>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        Rs {month.total.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pl-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Hospital: </span>
                        <span className="font-medium text-foreground">
                          Rs {month.hospitalRs.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Medicine: </span>
                        <span className="font-medium text-foreground">
                          Rs {month.medicineRs.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {month !== monthlyTotals[monthlyTotals.length - 1] && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly" className="space-y-6 mt-6">
          <SpendingChart
            data={yearlyTotals}
            title="Yearly Spending Trends"
            description="Hospital and medicine charges by year"
          />

          <Card>
            <CardHeader>
              <CardTitle>Yearly Breakdown</CardTitle>
              <CardDescription>Detailed yearly totals for hospital and medicine charges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {yearlyTotals.map((year) => (
                  <div key={year.year}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{year.label}</span>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        Rs {year.total.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pl-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Hospital: </span>
                        <span className="font-medium text-foreground">
                          Rs {year.hospitalRs.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Medicine: </span>
                        <span className="font-medium text-foreground">
                          Rs {year.medicineRs.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {year !== yearlyTotals[yearlyTotals.length - 1] && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
