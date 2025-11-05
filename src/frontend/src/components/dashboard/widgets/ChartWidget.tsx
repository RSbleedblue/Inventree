import { t } from '@lingui/core/macro';
import { Center, getThemeColor, Stack, Text, Title, useMantineTheme } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

import { ModelInformationDict } from '@lib/enums/ModelInformation';
import type { ModelType } from '@lib/enums/ModelType';
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

      return api
        .get(apiUrl(modelProperties.api_endpoint), {
          params: {
            ...params,
            limit: 100
          }
        })
        .then((res) => res.data);
    }
  });

  // Generate sample data if no data is available
  const chartData = useMemo(() => {
    const results = query.data?.results ?? [];
    
    if (results.length === 0) {
      // Return empty chart data with sample structure
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map((day) => ({ name: day, value: 0 }));
    }

    // Process real data - this is a simple example
    // You might want to aggregate by date or other fields
    return results.slice(0, 7).map((item: any, index: number) => ({
      name: `Item ${index + 1}`,
      value: 1
    }));
  }, [query.data]);

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

