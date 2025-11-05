import { t } from '@lingui/core/macro';
import {
  Alert,
  Card,
  Center,
  Divider,
  Loader,
  Space,
  Text
} from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { IconExclamationCircle, IconInfoCircle } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Layout, Responsive, WidthProvider } from 'react-grid-layout';

import { useShallow } from 'zustand/react/shallow';
import { useDashboardItems } from '../../hooks/UseDashboardItems';
import { useLocalState } from '../../states/LocalState';
import DashboardMenu from './DashboardMenu';
import DashboardWidget, { type DashboardWidgetProps } from './DashboardWidget';
import DashboardWidgetDrawer from './DashboardWidgetDrawer';

const ReactGridLayout = WidthProvider(Responsive);

export default function DashboardLayout() {
  // Dashboard layout definition
  const [layouts, setLayouts] = useState({});
  // Dashboard widget selection
  const [widgets, setWidgets] = useState<DashboardWidgetProps[]>([]);

  // local/remote storage values for widget / layout
  const [
    remoteWidgets,
    setRemoteWidgets,
    remoteLayouts,
    setRemoteLayouts,
    showSampleDashboard,
    setShowSampleDashboard
  ] = useLocalState(
    useShallow((state) => [
      state.widgets,
      state.setWidgets,
      state.layouts,
      state.setLayouts,
      state.showSampleDashboard,
      state.setShowSampleDashboard
    ])
  );

  const [editing, setEditing] = useDisclosure(false);
  const [removing, setRemoving] = useDisclosure(false);

  const [
    widgetDrawerOpened,
    { open: openWidgetDrawer, close: closeWidgetDrawer }
  ] = useDisclosure(false);

  const [loaded, setLoaded] = useState(false);

  // Keyboard shortcut for editing the dashboard layout
  useHotkeys([
    [
      'mod+E',
      () => {
        setEditing.toggle();
      }
    ]
  ]);

  // Load available widgets
  const availableWidgets = useDashboardItems();

  const widgetLabels = useMemo(() => {
    return widgets.map((widget: DashboardWidgetProps) => widget.label);
  }, [widgets]);

  // Save the selected widgets to local storage when the selection changes
  useEffect(() => {
    if (loaded) {
      setRemoteWidgets(widgetLabels);
    }
  }, [widgetLabels]);

  /**
   * Callback function to add a new widget to the dashboard
   */
  const addWidget = useCallback(
    (widget: string) => {
      const newWidget = availableWidgets.items.find(
        (wid) => wid.label === widget
      );

      if (newWidget) {
        if (showSampleDashboard) {
          setShowSampleDashboard(false);
        }
        setWidgets([...widgets, newWidget]);
      }

      // Update the layouts to include the new widget (and enforce initial size)
      const _layouts: any = { ...layouts };

      Object.keys(_layouts).forEach((key) => {
        _layouts[key] = updateLayoutForWidget(_layouts[key], widgets, true);
      });

      setLayouts(_layouts);
    },
    [availableWidgets.items, widgets, layouts]
  );

  /**
   * Callback function to remove a widget from the dashboard
   */
  const removeWidget = useCallback(
    (widget: string) => {
      // Remove the widget from the list
      setWidgets(widgets.filter((item) => item.label !== widget));

      // Remove the widget from the layout
      const _layouts: any = { ...layouts };

      Object.keys(_layouts).forEach((key) => {
        _layouts[key] = _layouts[key].filter(
          (item: Layout) => item.i !== widget
        );
      });

      setLayouts(_layouts);
    },
    [widgets, layouts]
  );

  // When the layout is rendered, ensure that the widget attributes are observed
  const updateLayoutForWidget = useCallback(
    (layout: any[], widgets: any[], overrideSize: boolean) => {
      return layout.map((item: Layout): Layout => {
        // Find the matching widget
        const widget = widgets.find(
          (widget: DashboardWidgetProps) => widget.label === item.i
        );

        const minH = widget?.minHeight ?? 2;
        const minW = widget?.minWidth ?? 1;

        let w = Math.max(item.w ?? 1, minW);
        let h = Math.max(item.h ?? 1, minH);

        if (overrideSize) {
          w = minW;
          h = minH;
        }

        return {
          ...item,
          w: w,
          h: h,
          minH: minH,
          minW: minW
        };
      });
    },
    []
  );

  // Rebuild layout when the widget list changes
  useEffect(() => {
    onLayoutChange({}, layouts);
  }, [widgets]);

  const onLayoutChange = useCallback(
    (layout: any, newLayouts: any) => {
      // Reconstruct layouts based on the widget requirements
      Object.keys(newLayouts).forEach((key) => {
        newLayouts[key] = updateLayoutForWidget(
          newLayouts[key],
          widgets,
          false
        );
      });

      if (layouts && loaded && availableWidgets.loaded) {
        const reducedLayouts: any = {};
        // Reduce the layouts to exclude default attributes from the dataset
        Object.keys(newLayouts).forEach((key) => {
          reducedLayouts[key] = newLayouts[key].map((item: Layout) => {
            return {
              ...item,
              moved: item.moved ? true : undefined,
              static: item.static ? true : undefined
            };
          });
        });
        setRemoteLayouts(reducedLayouts);
        setLayouts(newLayouts);
      }
    },
    [loaded, widgets, availableWidgets.loaded]
  );

  // Helper function to get default widget labels for new users
  const getDefaultWidgetLabels = useCallback((items: DashboardWidgetProps[]): string[] => {
    const labels: string[] = [];
    
    // Prioritize filtered-orders-chart (interactive chart with filters)
    if (items.find((w) => w.label === 'filtered-orders-chart')) labels.push('filtered-orders-chart');
    
    // Also include simple orders-chart
    if (items.find((w) => w.label === 'orders-chart')) labels.push('orders-chart');
    
    // Prioritize analytics widgets
    if (items.find((w) => w.label === 'stock-analytics')) labels.push('stock-analytics');
    if (items.find((w) => w.label === 'orders-analytics')) labels.push('orders-analytics');
    
    // Add some key statistics
    if (items.find((w) => w.label === 'low-stk')) labels.push('low-stk');
    if (items.find((w) => w.label === 'act-bo')) labels.push('act-bo');
    if (items.find((w) => w.label === 'act-so')) labels.push('act-so');
    if (items.find((w) => w.label === 'act-po')) labels.push('act-po');
    
    // Fallback to getting started if available
    if (labels.length === 0 && items.find((w) => w.label === 'gstart')) {
      labels.push('gstart');
    }
    
    return labels;
  }, []);

  // Helper function to generate default layouts
  const getDefaultLayouts = useCallback((widgetLabels: string[], items: DashboardWidgetProps[]): any => {
    const layouts: Layout[] = [];
    let x = 0;
    let y = 0;
    const maxWidth = 12;

    widgetLabels.forEach((label, index) => {
      const widget = items.find((w) => w.label === label);
      if (!widget) return;

      let w = widget.minWidth || 4;
      let h = widget.minHeight || 3;

      // Check if widget would overflow
      if (x + w > maxWidth) {
        x = 0;
        y += Math.max(...layouts.filter((l) => l.x === x).map((l) => l.y + (l.h || 3)) || [0]);
      }

      layouts.push({
        w,
        h,
        x,
        y,
        i: label,
        minW: widget.minWidth || 1,
        minH: widget.minHeight || 1,
        moved: false,
        static: false
      });

      x += w;
      if (x >= maxWidth) {
        x = 0;
        y += h;
      }
    });

    return { lg: layouts };
  }, []);

  // Load the dashboard layout from local storage
  useEffect(() => {
    if (availableWidgets.loaded) {
      // If no widgets are saved, use default widgets for new users
      const hasCustomWidgets = remoteWidgets && remoteWidgets.length > 0;
      
      if (hasCustomWidgets) {
        setLayouts(remoteLayouts);
        setWidgets(
          availableWidgets.items.filter((widget) =>
            remoteWidgets.includes(widget.label)
          )
        );
      } else {
        // New user - show default analytics dashboard
        const defaultWidgetLabels = getDefaultWidgetLabels(availableWidgets.items);
        setLayouts(getDefaultLayouts(defaultWidgetLabels, availableWidgets.items));
        setWidgets(
          availableWidgets.items.filter((widget) =>
            defaultWidgetLabels.includes(widget.label)
          )
        );
      }

      setLoaded(true);
    }
  }, [availableWidgets.loaded, getDefaultWidgetLabels, getDefaultLayouts]);

  // Clear all widgets from the dashboard
  const clearWidgets = useCallback(() => {
    if (showSampleDashboard) {
      setShowSampleDashboard(false);
    }
    setWidgets([]);
    setLayouts({});
  }, []);


  return (
    <>
      <DashboardWidgetDrawer
        opened={widgetDrawerOpened}
        onClose={closeWidgetDrawer}
        onAddWidget={addWidget}
        currentWidgets={widgetLabels}
      />
      <DashboardMenu
        onAddWidget={openWidgetDrawer}
        onStartEdit={setEditing.open}
        onClear={clearWidgets}
        onStartRemove={setRemoving.open}
        onAcceptLayout={() => {
          setEditing.close();
          setRemoving.close();
        }}
        editing={editing}
        removing={removing}
      />
      <Divider p='xs' />
      {availableWidgets.error && (
        <Alert color='red' title={t`Error`} icon={<IconExclamationCircle />}>
          {t`Failed to load dashboard widgets.`}
        </Alert>
      )}
      {layouts && loaded && availableWidgets.loaded ? (
        <>
          {widgetLabels.length == 0 ? (
            <Center>
              <Card shadow='xs' padding='xl' style={{ width: '100%' }}>
                <Alert
                  color='blue'
                  title={t`No Widgets Selected`}
                  icon={<IconInfoCircle />}
                >
                  <Text>{t`Use the menu to add widgets to the dashboard`}</Text>
                </Alert>
              </Card>
            </Center>
          ) : (
            WidgetGrid(
              layouts,
              onLayoutChange,
              editing,
              widgets,
              removing,
              removeWidget
            )
          )}
        </>
      ) : (
        <Center>
          <Loader size='xl' />
        </Center>
      )}
    </>
  );
}

function WidgetGrid(
  layouts: {},
  onLayoutChange: (layout: any, newLayouts: any) => void,
  editing: boolean,
  widgets: DashboardWidgetProps[],
  removing: boolean,
  removeWidget: (widget: string) => void
) {
  return (
    <ReactGridLayout
      className='dashboard-layout'
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={64}
      layouts={layouts}
      onLayoutChange={onLayoutChange}
      compactType={'vertical'}
      isDraggable={editing}
      isResizable={editing}
      margin={[10, 10]}
      containerPadding={[0, 0]}
      resizeHandles={['ne', 'se', 'sw', 'nw']}
    >
      {widgets.map((item: DashboardWidgetProps) => {
        return DashboardWidget({
          item: item,
          editing: editing,
          removing: removing,
          onRemove: () => {
            removeWidget(item.label);
          }
        });
      })}
    </ReactGridLayout>
  );
}
