import { t } from '@lingui/core/macro';
import * as React from 'react';
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { navigateToLink } from '@lib/functions/Navigation';
import { InvenTreeIcon } from '../../functions/icons';
import { useGlobalSettingsState } from '../../states/SettingsStates';
import { useUserState } from '../../states/UserState';
import { InvexLogo } from '../items/InvenTreeLogo';
import { type MenuLinkItem } from '../items/MenuLinks';
import { INVEX_INSTANCE_NAME } from '../../constants/constants';
import { useLocalState } from '../../states/LocalState';

const drawerWidth = 280;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));

export function NavigationDrawer({
  opened,
  close
}: Readonly<{
  opened: boolean;
  close: () => void;
}>) {
  const theme = useTheme();
  const [navigationOpen, setNavigationOpen] = useLocalState(
    useShallow((state) => [state.navigationOpen, state.setNavigationOpen])
  );
  // Default to open (true) if navigationOpen is not set
  const [open, setOpen] = React.useState(navigationOpen !== undefined ? navigationOpen : true);

  React.useEffect(() => {
    if (navigationOpen !== undefined) {
      setOpen(navigationOpen);
    }
  }, [navigationOpen]);

  // Initialize navigationOpen to true if it's undefined
  React.useEffect(() => {
    if (navigationOpen === undefined) {
      setNavigationOpen(true);
      setOpen(true);
    }
  }, [navigationOpen, setNavigationOpen]);

  const handleDrawerOpen = () => {
    setOpen(true);
    setNavigationOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
    setNavigationOpen(false);
  };

  return (
    <Drawer variant="permanent" open={open}>
      <DrawerHeader>
        {open ? (
          <div className='flex items-center gap-2 flex-1 justify-center'>
            <InvexLogo height={18} width={18} />
            <div className='font-bold text-lg'>
              {INVEX_INSTANCE_NAME.toUpperCase()}
            </div>
          </div>
        ) : null}
        <IconButton onClick={open ? handleDrawerClose : handleDrawerOpen}>
          {theme.direction === 'rtl' ? (
            open ? <ChevronLeftIcon /> : <ChevronRightIcon />
          ) : (
            open ? <ChevronLeftIcon /> : <ChevronRightIcon />
          )}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <DrawerContent closeFunc={close} open={open} />
    </Drawer>
  );
}

function DrawerContent({
  closeFunc,
  open
}: Readonly<{
  closeFunc?: () => void;
  open: boolean;
}>) {
  const user = useUserState();
  const globalSettings = useGlobalSettingsState();
  const navigate = useNavigate();

  // Construct menu items
  const menuItemsNavigate: MenuLinkItem[] = useMemo(() => {
    return [
      {
        id: 'home',
        title: t`Dashboard`,
        link: '/',
        icon: 'dashboard'
      },
      {
        id: 'parts',
        title: t`Parts`,
        hidden: !user.hasViewPermission(ModelType.part),
        link: '/part',
        icon: 'part'
      },
      {
        id: 'stock',
        title: t`Stock`,
        link: '/stock',
        hidden: !user.hasViewPermission(ModelType.stockitem),
        icon: 'stock'
      },
      {
        id: 'build',
        title: t`Orders`,
        link: '/manufacturing/',
        hidden: !user.hasViewRole(UserRoles.build),
        icon: 'build'
      },
      {
        id: 'purchasing',
        title: t`Purchasing`,
        link: '/purchasing/',
        hidden: !user.hasViewRole(UserRoles.purchase_order),
        icon: 'purchase_orders'
      },
      {
        id: 'sales',
        title: t`Sales`,
        link: '/sales/',
        hidden: !user.hasViewRole(UserRoles.sales_order),
        icon: 'sales_orders'
      },
      {
        id: 'users',
        title: t`Users`,
        link: '/core/index/users',
        icon: 'user'
      },
      {
        id: 'groups',
        title: t`Groups`,
        link: '/core/index/groups',
        icon: 'group'
      }
    ];
  }, [user]);

  const menuItemsAction: MenuLinkItem[] = useMemo(() => {
    return [
      {
        id: 'barcode',
        title: t`Scan Barcode`,
        link: '/scan',
        icon: 'barcode',
        hidden: !globalSettings.isSet('BARCODE_ENABLE')
      }
    ];
  }, [globalSettings]);

  const menuItemsSettings: MenuLinkItem[] = useMemo(() => {
    return [
      {
        id: 'notifications',
        title: t`Notifications`,
        link: '/notifications',
        icon: 'notification'
      },
      {
        id: 'user-settings',
        title: t`User Settings`,
        link: '/settings/user',
        icon: 'user'
      },
      {
        id: 'system-settings',
        title: t`System Settings`,
        link: '/settings/system',
        icon: 'system',
        hidden: !user.isStaff()
      },
      {
        id: 'admin-center',
        title: t`Admin Center`,
        link: '/settings/admin',
        icon: 'admin',
        hidden: !user.isStaff()
      }
    ];
  }, [user]);

  const visibleNavItems = menuItemsNavigate.filter((item) => !item.hidden);
  const visibleActionItems = menuItemsAction.filter((item) => !item.hidden);
  const visibleSettingsItems = menuItemsSettings.filter((item) => !item.hidden);

  const handleItemClick = (item: MenuLinkItem) => {
    if (item.link) {
      closeFunc?.();
      navigateToLink(item.link, navigate, null as any);
    } else if (item.action) {
      closeFunc?.();
      item.action();
    }
  };

  return (
    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
      <List>
        {visibleNavItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => handleItemClick(item)}
              sx={[
                {
                  minHeight: 48,
                  px: 2.5,
                },
                open
                  ? {
                      justifyContent: 'initial',
                    }
                  : {
                      justifyContent: 'center',
                    },
              ]}
            >
              <ListItemIcon
                sx={[
                  {
                    minWidth: 0,
                    justifyContent: 'center',
                  },
                  open
                    ? {
                        mr: 3,
                      }
                    : {
                        mr: 'auto',
                      },
                ]}
              >
                {item.icon && (
                  <InvenTreeIcon icon={item.icon} iconProps={{ size: 20 }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={typeof item.title === 'string' ? item.title : item.title}
                sx={[
                  open
                    ? {
                        opacity: 1,
                      }
                    : {
                        opacity: 0,
                      },
                ]}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemText
            primary={t`Actions`}
            sx={[
              {
                px: 2.5,
                py: 1,
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
              },
              open
                ? {
                    opacity: 1,
                  }
                : {
                    opacity: 0,
                  },
            ]}
          />
        </ListItem>
        {visibleActionItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => handleItemClick(item)}
              sx={[
                {
                  minHeight: 48,
                  px: 2.5,
                },
                open
                  ? {
                      justifyContent: 'initial',
                    }
                  : {
                      justifyContent: 'center',
                    },
              ]}
            >
              <ListItemIcon
                sx={[
                  {
                    minWidth: 0,
                    justifyContent: 'center',
                  },
                  open
                    ? {
                        mr: 3,
                      }
                    : {
                        mr: 'auto',
                      },
                ]}
              >
                {item.icon && (
                  <InvenTreeIcon icon={item.icon} iconProps={{ size: 20 }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={typeof item.title === 'string' ? item.title : item.title}
                sx={[
                  open
                    ? {
                        opacity: 1,
                      }
                    : {
                        opacity: 0,
                      },
                ]}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemText
            primary={t`Settings`}
            sx={[
              {
                px: 2.5,
                py: 1,
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
              },
              open
                ? {
                    opacity: 1,
                  }
                : {
                    opacity: 0,
                  },
            ]}
          />
        </ListItem>
        {visibleSettingsItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => handleItemClick(item)}
              sx={[
                {
                  minHeight: 48,
                  px: 2.5,
                },
                open
                  ? {
                      justifyContent: 'initial',
                    }
                  : {
                      justifyContent: 'center',
                    },
              ]}
            >
              <ListItemIcon
                sx={[
                  {
                    minWidth: 0,
                    justifyContent: 'center',
                  },
                  open
                    ? {
                        mr: 3,
                      }
                    : {
                        mr: 'auto',
                      },
                ]}
              >
                {item.icon && (
                  <InvenTreeIcon icon={item.icon} iconProps={{ size: 20 }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={typeof item.title === 'string' ? item.title : item.title}
                sx={[
                  open
                    ? {
                        opacity: 1,
                      }
                    : {
                        opacity: 0,
                      },
                ]}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
