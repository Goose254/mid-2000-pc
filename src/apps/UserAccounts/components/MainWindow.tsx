import React, { useState } from 'react';
import styles from './styles.module.scss';
import { useTranslation } from 'react-i18next';

import { useUsersStore } from '@/common/stores/usersStore';
import { AVATARS } from '@/common/utils/avatars';
import { Avatar } from '@/components/atoms/Avatar/Avatar';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';

import TitleIcon from '@/assets/windows-icons/shell32.dll_14_137-8.png';

export const UserAccountsMainWindow: React.FC = () => {
  const { t } = useTranslation('common', { keyPrefix: 'userAccounts' });

  const users = useUsersStore((state) => state.users);
  const currentUserId = useUsersStore((state) => state.currentUserId);
  const addUser = useUsersStore((state) => state.addUser);
  const renameUser = useUsersStore((state) => state.renameUser);
  const removeUser = useUsersStore((state) => state.removeUser);
  const setAvatar = useUsersStore((state) => state.setAvatar);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [pickingAvatarId, setPickingAvatarId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState(AVATARS[1].id);

  const canDelete = users.length > 1;

  const handleSelect = (id: string) => {
    setSelectedId((current) => (current === id ? null : id));
    setRenamingId(null);
    setPickingAvatarId(null);
  };

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
    setPickingAvatarId(null);
  };

  const commitRename = () => {
    if (renamingId) {
      renameUser(renamingId, renameValue);
    }
    setRenamingId(null);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    addUser(newName, newAvatar);
    setNewName('');
    setNewAvatar(AVATARS[1].id);
  };

  return (
    <div className={styles.applet}>
      <div className={styles.banner}>
        <img src={TitleIcon} alt="" className={styles.bannerIcon} />
        <span className={styles.bannerTitle}>{t('title')}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.pickLabel}>{t('orPickAccount')}</div>

        <div className={styles.accountList}>
          {users.map((user) => {
            const isSelected = selectedId === user.id;
            const isRenaming = renamingId === user.id;
            const isPicking = pickingAvatarId === user.id;

            return (
              <div
                key={user.id}
                className={`${styles.accountRow} ${isSelected ? styles.accountRowSelected : ''}`}
              >
                <div className={styles.accountMain} onClick={() => handleSelect(user.id)}>
                  <Avatar avatar={user.avatar} name={user.name} size={44} />
                  <span className={styles.accountText}>
                    {isRenaming ? (
                      <Input
                        value={renameValue}
                        autoFocus
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => setRenameValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') commitRename();
                          if (event.key === 'Escape') setRenamingId(null);
                        }}
                      />
                    ) : (
                      <span className={styles.accountName}>{user.name}</span>
                    )}
                    <span className={styles.accountType}>
                      {user.isAdmin ? t('administrator') : t('limited')}
                      {currentUserId === user.id ? ` · ${t('connected')}` : ''}
                    </span>
                  </span>
                </div>

                {isSelected && (
                  <div className={styles.actions}>
                    {isRenaming ? (
                      <>
                        <Button size="small" onClick={commitRename}>{t('save')}</Button>
                        <Button size="small" onClick={() => setRenamingId(null)}>{t('cancel')}</Button>
                      </>
                    ) : (
                      <>
                        <Button size="small" onClick={() => startRename(user.id, user.name)}>
                          {t('rename')}
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setPickingAvatarId((current) => (current === user.id ? null : user.id))}
                        >
                          {t('changePicture')}
                        </Button>
                        <Button
                          size="small"
                          disabled={!canDelete}
                          title={!canDelete ? t('lastAccountNotice') : undefined}
                          onClick={() => {
                            removeUser(user.id);
                            setSelectedId(null);
                          }}
                        >
                          {t('delete')}
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {isSelected && isPicking && (
                  <div className={styles.avatarPalette}>
                    {AVATARS.map((avatarDef) => (
                      <button
                        key={avatarDef.id}
                        type="button"
                        className={`${styles.avatarChoice} ${user.avatar === avatarDef.id ? styles.avatarChoiceSelected : ''}`}
                        onClick={() => {
                          setAvatar(user.id, avatarDef.id);
                          setPickingAvatarId(null);
                        }}
                      >
                        <Avatar avatar={avatarDef.id} name={user.name} size={36} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.createSection}>
          <div className={styles.createTitle}>{t('createAccount')}</div>
          <div className={styles.createRow}>
            <Avatar avatar={newAvatar} name={newName || 'A'} size={40} />
            <Input
              value={newName}
              placeholder={t('namePlaceholder')}
              wrapperClassName={styles.createInput}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCreate();
              }}
            />
            <Button size="small" disabled={!newName.trim()} onClick={handleCreate}>
              {t('create')}
            </Button>
          </div>
          <div className={styles.createPalette}>
            {AVATARS.map((avatarDef) => (
              <button
                key={avatarDef.id}
                type="button"
                className={`${styles.avatarChoice} ${newAvatar === avatarDef.id ? styles.avatarChoiceSelected : ''}`}
                onClick={() => setNewAvatar(avatarDef.id)}
              >
                <Avatar avatar={avatarDef.id} name={newName || 'A'} size={30} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
