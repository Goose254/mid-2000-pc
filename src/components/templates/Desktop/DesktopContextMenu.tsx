import React from 'react';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { useTranslation } from 'react-i18next';

export const DesktopContextMenu: React.FC = () => {
  const { t } = useTranslation('common', { keyPrefix: 'desktop.contextMenu' });

  return (
    <FloatingMenu>
      <MenuItem label={t('arrangeIconsBy')}>
        <FloatingMenu>
          <MenuItem label={t('name')}/>
          <MenuItem label={t('size')}/>
          <MenuItem label={t('type')}/>
          <MenuItem label={t('modified')}/>
          <MenuSeparator />
          <MenuItem label={t('showInGroups')} aria-disabled/>
          <MenuItem label={t('autoArrange')}/>
          <MenuItem label={t('alignToGrid')}/>
          <MenuSeparator />
          <MenuItem label={t('showDesktopIcons')}/>
          <MenuItem label={t('lockWebItemsOnDesktop')}/>
          <MenuItem label={t('runDesktopCleanupWizard')}/>
        </FloatingMenu>
      </MenuItem>
      <MenuItem label={t('refresh')}/>
      <MenuSeparator />
      <MenuItem label={t('paste')} aria-disabled/>
      <MenuItem label={t('pasteShortcut')} aria-disabled/>
      <MenuSeparator />
      <MenuItem label={t('new')}>
        <FloatingMenu>
          <MenuItem label={t('folder')}/>
          <MenuItem label={t('shortcut')}/>
          <MenuSeparator />
          <MenuItem label={t('briefcase')}/>
          <MenuItem label={t('bitmapImage')}/>
          <MenuItem label={t('wordPadDocument')}/>
          <MenuItem label={t('rtfFormatDocument')}/>
          <MenuItem label={t('textDocument')}/>
          <MenuItem label={t('waveSound')}/>
          <MenuItem label={t('compressedFolder')}/>
        </FloatingMenu>
      </MenuItem>
      <MenuSeparator />
      <MenuItem label={t('properties')}/>
    </FloatingMenu>
  );
};
