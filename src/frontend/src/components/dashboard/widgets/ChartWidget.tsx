import { t } from '@lingui/core/macro';
import { Center, getThemeColor, Stack, Text, Title, useMantineTheme } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

import { ModelInformationDict } from '@lib/enums/ModelInformation';
import { ModelType } from '@lib/enums/ModelType';
import { apiUrl } from '@lib/functions/Api';
import { useDocumentVisibility } from '@mantine/hooks';
import { useApi } from '../../../contexts/ApiContext';
import { useUserState } from '../../../states/UserState';

interface ChartWidgetProps {
  title: string;
  modelType: ModelType;
  params?: any;
  chartType?: 'line' | 'bar';
}

export default function ChartWidget({
  title,
  modelType,
  params,
  chartType = 'line'
}: Readonly<ChartWidgetProps>) {
  const api = useApi();
  const user = useUserState();
  const visibility = useDocumentVisibility();
  const theme = useMantineTheme();
  const primaryColor = getThemeColor(theme.primaryColor, theme);

  const modelProperties = ModelInformationDict[modelType];

  const query = useQuery({
    queryKey: ['chart', modelType, params, visibility],
    enabled: user.hasViewPermission(modelType) && visibility === 'visible',
    refetchOnMount: true,
    refetchInterval: 10 * 60 * 1000,
    queryFn: () => {
      if (visibility !== 'visible') {
        return null;
      }

      // For order types, get more results to aggregate by day
      const limit = (modelType === ModelType.salesorder || 
                     modelType === ModelType.purchaseorder || 
                     modelType === ModelType.build) ? 1000 : 100;
      
      const orderParams: any = {
        ...params,
        limit
      };
      
      // Add ordering for order types
      if (limit === 1000) {
        orderParams.ordering = '-creation_date';
      }
      
      return api
        .get(apiUrl(modelProperties.api_endpoint), {
          params: orderParams
        })
        .then((res) => res.data);
    }
  });

  // Generate chart data - aggregate orders by day
  const chartData = useMemo(() => {
    const results = query.data?.results ?? [];
    
    // Check if this is an order type (salesorder, purchaseorder, or build)
    const isOrderType = modelType === ModelType.salesorder || 
                       modelType === ModelType.purchaseorder || 
                       modelType === ModelType.build;
    
    if (isOrderType) {
      // Aggregate orders by day for the last 7 days
      const ordersByDay: Record<string, number> = {};
      const today = new Date();
      const days = [];
      
      // Get last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        days.push({ dayKey, dayName });
        ordersByDay[dayKey] = 0;
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
    } else {
      // For non-order types, use original logic
      if (results.length === 0) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map((day) => ({ name: day, value: 0 }));
      }

      return results.slice(0, 7).map((item: any, index: number) => ({
        name: `Item ${index + 1}`,
        value: 1
      }));
    }
  }, [query.data, modelType]);

  return (
    <Stack gap="xs" style={{ height: '100%' }}>
      <Title order={4} style={{ color: primaryColor }}>{title}</Title>
      {query.isFetching ? (
        <Center style={{ height: '100%' }}>
          <Text size="sm" c="dimmed">Loading...</Text>
        </Center>
      ) : query.isError ? (
        <Center style={{ height: '100%' }}>
          <Text size="sm" c="red">Error loading data</Text>
        </Center>
      ) : (
        <div style={{ height: '100%', minHeight: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={primaryColor}
                  strokeWidth={2}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={primaryColor} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
      {chartData.every((item: any) => item.value === 0) && (
        <Center>
          <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
            {t`No data available`}
          </Text>
        </Center>
      )}
    </Stack>
  );
}

