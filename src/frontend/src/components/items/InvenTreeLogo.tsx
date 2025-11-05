import { t } from '@lingui/core/macro';
import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { forwardRef } from 'react';
import { NavLink } from 'react-router-dom';
import synthlaneLogoUrl from '../../../public/synthlaneLOGO.svg';

export const InvenTreeLogo = ({height = 18, width = 18}: {height: number, width: number}) => {
  const { colorScheme } = useMantineColorScheme();

  return (
    <img
      src={synthlaneLogoUrl}
      alt={t`InvenTree Logo`}
      height={height}
      width={width}
      style={{
        filter: colorScheme === 'light' ? 'invert(1)' : 'none',
        transition: 'filter 0.2s ease-in-out',
      }}
    />
  );
};

export const InvenTreeLogoHomeButton = forwardRef<HTMLDivElement>((props, ref) => (
  <div ref={ref} {...props}>
    <NavLink to='/'>
      <ActionIcon size={28} variant='transparent'>
        <InvenTreeLogo height={28} width={28} />
      </ActionIcon>
    </NavLink>
  </div>
));
