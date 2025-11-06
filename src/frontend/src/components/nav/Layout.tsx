import { t } from "@lingui/core/macro";
import { Container, Flex, Space } from "@mantine/core";
import { Spotlight, createSpotlight } from "@mantine/spotlight";
import { IconSearch } from "@tabler/icons-react";
import { type JSX, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";

import { getActions } from "../../defaults/actions";
import * as classes from "../../main.css";
import { useUserSettingsState } from "../../states/SettingsStates";
import { useUserState } from "../../states/UserState";
import { Boundary } from "../Boundary";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { NavigationDrawer } from "./NavigationDrawer";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const location = useLocation();
  const { isLoggedIn } = useUserState();

  if (!isLoggedIn()) {
    return (
      <Navigate
        to="/logged-in"
        state={{
          redirectUrl: location.pathname,
          queryParams: location.search,
          anchor: location.hash,
        }}
      />
    );
  }

  return children;
};

export const [firstStore, firstSpotlight] = createSpotlight();

export default function LayoutComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const userSettings = useUserSettingsState();

  const defaultActions = getActions(navigate);
  const [actions, setActions] = useState(defaultActions);
  const [customActions, setCustomActions] = useState<boolean>(false);

  function actionsAreChanging(change: []) {
    if (change.length > defaultActions.length) setCustomActions(true);
    setActions(change);
  }
  // firstStore.subscribe(actionsAreChanging);

  // clear additional actions on location change
  useEffect(() => {
    if (customActions) {
      setActions(defaultActions);
      setCustomActions(false);
    }
  }, [location]);

  return (
    <ProtectedRoute>
      <Box
        sx={{ display: "flex", minHeight: "100vh" }}
        style={{
          background:
            "url('https://www.zoho.com/inventory/inventory-software-demo/assets/images/svgs/home-header-bg-zom-f063611a9d.svg')",
        }}
      >
        {/* <CssBaseline /> */}
        <NavigationDrawer opened={true} close={() => {}} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            width: "100%",
          }}
        >
          <Header />
          <Box sx={{ flexGrow: 1 }}>
            <Container className={classes.layoutContent} size="100%">
              <Boundary label={"layout"}>
                <Outlet />
              </Boundary>
            </Container>
          </Box>
          <Space h="xl" />
          <Footer />
        </Box>
        {userSettings.isSet("SHOW_SPOTLIGHT") && (
          <Spotlight
            actions={actions}
            store={firstStore}
            highlightQuery
            searchProps={{
              leftSection: <IconSearch size="1.2rem" />,
              placeholder: t`Search...`,
            }}
            shortcut={["mod + K"]}
            nothingFound={t`Nothing found...`}
          />
        )}
      </Box>
    </ProtectedRoute>
  );
}
