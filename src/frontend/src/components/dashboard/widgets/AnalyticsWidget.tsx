import { t } from '@lingui/core/macro';
import { ActionIcon, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { IconExclamationCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { ModelInformationDict } from '@lib/enums/ModelInformation';
import type { ModelType } from '@lib/enums/ModelType';
import { apiUrl } from '@lib/functions/Api';
import { navigateToLink } from '@lib/functions/Navigation';
import { useDocumentVisibility } from '@mantine/hooks';
import { useApi } from '../../../contexts/ApiContext';
import { InvenTreeIcon } from '../../../functions/icons';
import { useUserState } from '../../../states/UserState';
import { StylishText } from '../../items/StylishText';

interface AnalyticsWidgetProps {
  title: string;
  items: Array<{
    label: string;
    modelType: ModelType;
    params?: any;
    icon?: string;
  }>;
}

export default function AnalyticsWidget({
  title,
  items
}: Readonly<AnalyticsWidgetProps>) {
  const api = useApi();
  const user = useUserState();
  const navigate = useNavigate();
  const visibility = useDocumentVisibility();

  const queries = items.map((item) => {
    const modelProperties = ModelInformationDict[item.modelType];
    return useQuery({
      queryKey: ['analytics', item.modelType, item.params, visibility],
      enabled:
        user.hasViewPermission(item.modelType) && visibility === 'visible',
      refetchOnMount: true,
      refetchInterval: 10 * 60 * 1000,
      queryFn: () => {
        if (visibility !== 'visible') {
          return null;
        }

        return api
          .get(apiUrl(modelProperties.api_endpoint), {
            params: {
              ...item.params,
              limit: 1
            }
          })
          .then((res) => res.data);
      }
    });
  });

  return (
    <Stack gap="xs" style={{ height: '100%' }}>
      <Title order={4}>{title}</Title>
      {items.map((item, index) => {
        const query = queries[index];
        const modelProperties = ModelInformationDict[item.modelType];
        const count = query.data?.count ?? 0;

        const onFollowLink = () => {
          if (!query.isFetched) {
            return;
          }

          if (modelProperties.url_overview) {
            let url = modelProperties.url_overview;

            if (item.params) {
              url += '?';
              for (const key in item.params) {
                url += `${key}=${item.params[key]}&`;
              }
            }

            navigateToLink(url, navigate, {} as any);
          }
        };

        return (
          <Group
            key={item.label}
            justify="space-between"
            style={{ cursor: 'pointer' }}
            onClick={onFollowLink}
          >
            <Group gap="xs">
              <InvenTreeIcon
                icon={item.icon ?? modelProperties.icon}
              />
              <Text size="sm">{item.label}</Text>
            </Group>
            <Group gap="xs">
              {query.isFetching ? (
                <Loader size="xs" />
              ) : query.isError ? (
                <ActionIcon color="red" variant="transparent" size="sm">
                  <IconExclamationCircle />
                </ActionIcon>
              ) : (
                <StylishText size="md">{count}</StylishText>
              )}
            </Group>
          </Group>
        );
      })}
    </Stack>
  );
}

