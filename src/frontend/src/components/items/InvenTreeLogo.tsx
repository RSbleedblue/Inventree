import { t } from '@lingui/core/macro';
import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { forwardRef } from 'react';
import { NavLink } from 'react-router-dom';

import synthlaneLogoSvg from '../../../public/synthlaneLOGO.svg';

export const InvenTreeLogoHomeButton = forwardRef<HTMLDivElement>(
  (props, ref) => {
    return (
      <div ref={ref} {...props}>
        <NavLink to={'/'}>
          <ActionIcon size={28} variant='transparent'>
            <InvenTreeLogo />
          </ActionIcon>
        </NavLink>
      </div>
    );
  }
);

export const InvenTreeLogo = () => {
  const { colorScheme } = useMantineColorScheme();

  return (
    <img
      src={synthlaneLogoSvg}
      alt={t`InvenTree Logo`}
      height={28}
      style={{
        // SVG has white fill (#FFFFFF)
        // For dark theme: keep white (brightness(0) invert(1) = white)
        // For light theme: make black (brightness(0) = black)
        filter: colorScheme === 'dark' ? 'brightness(2) invert(1)' : 'brightness(0)',
      }}
    />
  );
};
