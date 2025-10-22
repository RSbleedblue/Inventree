import { t } from '@lingui/core/macro';
import { ActionIcon } from '@mantine/core';
import { forwardRef } from 'react';
import { NavLink } from 'react-router-dom';

import synthlaneLogo from '../../../src/assets/synthalaneLOGO.png';

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
  return <img src={synthlaneLogo} alt={t`InvenTree Logo`} height={28} />;
};
