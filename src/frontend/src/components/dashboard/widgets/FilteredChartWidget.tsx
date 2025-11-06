import { t } from '@lingui/core/macro';
import { 
  Center, 
  getThemeColor, 
  Stack, 
  Text, 
  Title, 
  useMantineTheme,
  Group,
  SegmentedControl,
  Select,
  Paper
} from '@mantine/core';
import { DateInput, type DateValue } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Legend
} from 'recharts';
import dayjs from 'dayjs';

import { ModelInformationDict } from '@lib/enums/ModelInformation';
import { ModelType } from '@lib/enums/ModelType';
import { apiUrl } from '@lib/functions/Api';
import { useDocumentVisibility } from '@mantine/hooks';
import { useApi } from '../../../contexts/ApiContext';
import { useUserState } from '../../../states/UserState';

interface FilteredChartWidgetProps {
  title?: string;
}

type ChartType = 'line' | 'bar';
type PeriodType = '7d' | '30d' | 'custom';

export default function FilteredChartWidget({
  title = t`Orders Chart`
}: Readonly<FilteredChartWidgetProps>) {
  const api = useApi();
  const user = useUserState();
  const visibility = useDocumentVisibility();
  const theme = useMantineTheme();
  const primaryColor = getThemeColor(theme.primaryColor, theme);

  // Filter states
  const [orderType, setOrderType] = useState<ModelType | null>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [period, setPeriod] = useState<PeriodType>('7d');
  const [startDate, setStartDate] = useState<DateValue>(null);
  const [endDate, setEndDate] = useState<DateValue>(null);

  // Get available order types based on permissions
  const availableOrderTypes = useMemo(() => {
    const types: Array<{ value: ModelType; label: string }> = [];
    if (user.hasViewPermission(ModelType.salesorder)) {
      types.push({ value: ModelType.salesorder, label: t`Sales Orders` });
    }
    if (user.hasViewPermission(ModelType.purchaseorder)) {
      types.push({ value: ModelType.purchaseorder, label: t`Purchase Orders` });
    }
    if (user.hasViewPermission(ModelType.build)) {
      types.push({ value: ModelType.build, label: t`Build Orders` });
    }
    return types;
  }, [user]);

  // Set default order type if available
  useMemo(() => {
    if (!orderType && availableOrderTypes.length > 0) {
      setOrderType(availableOrderTypes[0].value);
    }
  }, [orderType, availableOrderTypes]);

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    if (period === '7d') {
      start = new Date(today);
      start.setDate(start.getDate() - 6); // Last 7 days including today
    } else if (period === '30d') {
      start = new Date(today);
      start.setDate(start.getDate() - 29); // Last 30 days including today
    } else {
      // Custom range
      start = startDate ? dayjs(startDate).toDate() : new Date(today);
      start.setDate(start.getDate() - 6); // Default to 7 days if not set
      end = endDate ? dayjs(endDate).toDate() : today;
    }

    return { start, end };
  }, [period, startDate, endDate]);

  // Build query parameters
  const queryParams = useMemo(() => {
    const params: any = {
      limit: 1000,
      ordering: '-creation_date'
    };

    // Add date filters
    if (dateRange.start) {
      params.creation_date__gte = dayjs(dateRange.start).format('YYYY-MM-DD');
    }
    if (dateRange.end) {
      params.creation_date__lte = dayjs(dateRange.end).format('YYYY-MM-DD');
    }

    return params;
  }, [dateRange]);

  // Fetch orders data
  const query = useQuery({
    queryKey: ['filtered-chart', orderType, queryParams, visibility],
    enabled: !!orderType && user.hasViewPermission(orderType) && visibility === 'visible',
    refetchOnMount: true,
    refetchInterval: 10 * 60 * 1000,
    queryFn: () => {
      if (visibility !== 'visible' || !orderType) {
        return null;
      }

      const modelProperties = ModelInformationDict[orderType];
      return api
        .get(apiUrl(modelProperties.api_endpoint), {
          params: queryParams
        })
        .then((res) => res.data);
    }
  });

  // Generate chart data aggregated by day
  const chartData = useMemo(() => {
    const results = query.data?.results ?? [];
    
    if (!dateRange.start || !dateRange.end) {
      return [];
    }

    // Generate all days in the range
    const ordersByDay: Record<string, number> = {};
    const days = [];
    const currentDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    while (currentDate <= endDate) {
      const dayKey = currentDate.toISOString().split('T')[0];
      const dayName = currentDate.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      days.push({ dayKey, dayName });
      ordersByDay[dayKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count orders per day
    results.forEach((order: any) => {
      if (order.creation_date) {
        const orderDate = new Date(order.creation_date);
        const orderDayKey = orderDate.toISOString().split('T')[0];
        if (ordersByDay.hasOwnProperty(orderDayKey)) {
          ordersByDay[orderDayKey]++;
        }
      }
    });

    // Convert to chart data format
    return days.map(({ dayKey, dayName }) => ({
      name: dayName,
      value: ordersByDay[dayKey] || 0
    }));
  }, [query.data, dateRange]);

  const handlePeriodChange = useCallback((value: PeriodType) => {
    setPeriod(value);
    if (value !== 'custom') {
      setStartDate(null);
      setEndDate(null);
    }
  }, []);

  if (availableOrderTypes.length === 0) {
    return (
      <Stack gap="xs" style={{ height: '100%' }}>
        <Title order={4} style={{ color: primaryColor }}>{title}</Title>
        <Center style={{ height: '200px' }}>
          <Text size="sm" c="dimmed">
            {t`No order permissions available`}
          </Text>
        </Center>
      </Stack>
    );
  }

  return (
    <Stack gap="xs" style={{ height: '100%' }}>
      <Title order={4} style={{ color: primaryColor }}>{title}</Title>
      
      {/* Filters */}
      <Paper p="xs" withBorder>
        <Stack gap="xs">
          <Group gap="xs" wrap="wrap">
            <Select
              label={t`Order Type`}
              value={orderType?.toString() || null}
              onChange={(value) => setOrderType(value as ModelType)}
              data={availableOrderTypes.map(t => ({
                value: t.value.toString(),
                label: t.label
              }))}
              style={{ flex: 1, minWidth: '150px' }}
            />
            
            <SegmentedControl
              value={chartType}
              onChange={(value) => setChartType(value as ChartType)}
              data={[
                { label: t`Line`, value: 'line' },
                { label: t`Bar`, value: 'bar' }
              ]}
            />
          </Group>

          <Group gap="xs" wrap="wrap">
            <SegmentedControl
              value={period}
              onChange={handlePeriodChange}
              data={[
                { label: t`Last 7 Days`, value: '7d' },
                { label: t`Last 30 Days`, value: '30d' },
                { label: t`Custom`, value: 'custom' }
              ]}
              style={{ flex: 1 }}
            />
          </Group>

          {period === 'custom' && (
            <Group gap="xs" wrap="wrap">
              <DateInput
                label={t`Start Date`}
                value={startDate}
                onChange={setStartDate}
                placeholder={t`Select start date`}
                style={{ flex: 1, minWidth: '150px' }}
              />
              <DateInput
                label={t`End Date`}
                value={endDate}
                onChange={setEndDate}
                placeholder={t`Select end date`}
                style={{ flex: 1, minWidth: '150px' }}
              />
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Chart */}
      {query.isFetching ? (
        <Center style={{ height: '250px' }}>
          <Text size="sm" c="dimmed">Loading...</Text>
        </Center>
      ) : query.isError ? (
        <Center style={{ height: '250px' }}>
          <Text size="sm" c="red">Error loading data</Text>
        </Center>
      ) : (
        <div style={{ height: '250px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 10 }}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={primaryColor}
                  strokeWidth={2}
                  dot={{ fill: primaryColor, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 10 }}
                />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  fill={primaryColor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length === 0 && !query.isFetching && (
        <Center>
          <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
            {t`No data available for selected period`}
          </Text>
        </Center>
      )}
    </Stack>
  );
}

