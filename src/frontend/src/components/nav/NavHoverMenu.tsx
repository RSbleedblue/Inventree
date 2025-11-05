import { UnstyledButton, useMantineColorScheme } from "@mantine/core";

import { InvexLogo } from "../items/InvenTreeLogo";
import { INVEX_INSTANCE_NAME } from "../../constants/constants";

export function NavHoverMenu({
  openDrawer,
}: Readonly<{
  openDrawer: () => void;
}>) {
  const { colorScheme } = useMantineColorScheme();

  const logoColor = colorScheme === "light" ? "black" : "white";

  return (
    <UnstyledButton onClick={() => openDrawer()} aria-label="navigation-menu">
      <div className="flex items-center gap-2">
        <InvexLogo height={18} width={18} />
        <div className={`font-bold text-lg text-${logoColor}`}>
          {INVEX_INSTANCE_NAME.toUpperCase()}
        </div>
      </div>
    </UnstyledButton>
  );
}
