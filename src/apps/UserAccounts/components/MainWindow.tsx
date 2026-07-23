import React, { useState } from 'react';
import styles from './styles.module.scss';
import { useTranslation } from 'react-i18next';

import { useUsersStore } from '@/common/stores/usersStore';
import { AVATARS, DEFAULT_AVATAR_ID } from '@/common/utils/avatars';
import { Avatar } from '@/components/atoms/Avatar/Avatar';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';

import BannerIcon from '@/assets/windows-icons/nusrmgr.cpl_14_200-7.png';
import AccountTaskIcon from '@/assets/windows-icons/nusrmgr.cpl_14_200-8.png';
import LogonTaskIcon from '@/assets/windows-icons/shell32.dll_14_45-10.png';

type View = 'home' | 'detail' | 'rename' | 'picture' | 'type' | 'password' | 'create';

interface TaskLinkProps {
  label: string;
  icon?: string;
  disabled?: boolean;
  onClick?: () => void;
}

/** Lien de tâche façon XP : texte bleu, souligné au survol, petite icône. */
const TaskLink: React.FC<TaskLinkProps> = ({ label, icon, disabled, onClick }) => (
  <button
    type="button"
    className={`${styles.taskLink} ${disabled ? styles.taskLinkDisabled : ''}`}
    disabled={disabled}
    onClick={onClick}
  >
    {icon ? <img src={icon} alt="" className={styles.taskLinkIcon} /> : <span className={styles.taskLinkBullet} />}
    <span className={styles.taskLinkLabel}>{label}</span>
  </button>
);

export const UserAccountsMainWindow: React.FC = () => {
  const { t } = useTranslation('common', { keyPrefix: 'userAccounts' });

  const users = useUsersStore((state) => state.users);
  const currentUserId = useUsersStore((state) => state.currentUserId);
  const addUser = useUsersStore((state) => state.addUser);
  const renameUser = useUsersStore((state) => state.renameUser);
  const removeUser = useUsersStore((state) => state.removeUser);
  const setAvatar = useUsersStore((state) => state.setAvatar);
  const setAccountType = useUsersStore((state) => state.setAccountType);
  const setPassword = useUsersStore((state) => state.setPassword);

  const [view, setView] = useState<View>('home');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Brouillons de formulaire des sous-écrans.
  const [nameDraft, setNameDraft] = useState('');
  const [avatarDraft, setAvatarDraft] = useState<string>(DEFAULT_AVATAR_ID);
  const [typeDraft, setTypeDraft] = useState(true);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwError, setPwError] = useState(false);

  // Assistant de création (nom -> type).
  const [createStep, setCreateStep] = useState<'name' | 'type'>('name');
  const [createName, setCreateName] = useState('');
  const [createIsAdmin, setCreateIsAdmin] = useState(true);
  const [createAvatar, setCreateAvatar] = useState(AVATARS[1].id);

  const selectedUser = users.find((user) => user.id === selectedId) ?? null;
  const canDelete = users.length > 1;

  const accountTypeLabel = (isAdmin?: boolean) => (isAdmin ? t('administrator') : t('limited'));

  // --- Navigation ---
  const goHome = () => {
    setView('home');
    setSelectedId(null);
  };
  const openDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };
  const openRename = () => {
    setNameDraft(selectedUser?.name ?? '');
    setView('rename');
  };
  const openPicture = () => {
    setAvatarDraft(selectedUser?.avatar ?? DEFAULT_AVATAR_ID);
    setView('picture');
  };
  const openType = () => {
    setTypeDraft(!!selectedUser?.isAdmin);
    setView('type');
  };
  const openPassword = () => {
    setPw1('');
    setPw2('');
    setPwError(false);
    setView('password');
  };
  const openCreate = () => {
    setCreateStep('name');
    setCreateName('');
    setCreateIsAdmin(true);
    setCreateAvatar(AVATARS[1].id);
    setView('create');
  };

  const goBack = () => {
    if (view === 'detail') {
      goHome();
    } else if (view === 'create') {
      if (createStep === 'type') setCreateStep('name');
      else goHome();
    } else {
      // rename / picture / type / password : retour au détail du compte.
      setView(selectedId ? 'detail' : 'home');
    }
  };

  // --- Commits ---
  const commitRename = () => {
    if (selectedId && nameDraft.trim()) renameUser(selectedId, nameDraft);
    setView('detail');
  };
  const commitPicture = () => {
    if (selectedId) setAvatar(selectedId, avatarDraft);
    setView('detail');
  };
  const commitType = () => {
    if (selectedId) setAccountType(selectedId, typeDraft);
    setView('detail');
  };
  const commitPassword = () => {
    if (pw1 !== pw2) {
      setPwError(true);
      return;
    }
    if (selectedId) setPassword(selectedId, pw1);
    setView('detail');
  };
  const commitDelete = () => {
    if (selectedId && canDelete) removeUser(selectedId);
    goHome();
  };
  const commitCreate = () => {
    if (!createName.trim()) return;
    addUser(createName, createAvatar, createIsAdmin);
    goHome();
  };

  const showBack = view !== 'home';

  return (
    <div className={styles.applet}>
      {/* Barre de navigation (flèche Précédent verte, façon Panneau de configuration) */}
      <div className={styles.navBar}>
        {showBack && (
          <button type="button" className={styles.backButton} onClick={goBack}>
            <span className={styles.backArrow}>&#10094;</span>
            <span>{t('back')}</span>
          </button>
        )}
      </div>

      {/* Bandeau bleu de titre */}
      <div className={styles.banner}>
        <span className={styles.bannerTitle}>{t('title')}</span>
        <img src={BannerIcon} alt="" className={styles.bannerIcon} />
      </div>

      <div className={styles.content}>
        <aside className={styles.sidebar}>
          {view === 'home' ? (
            <>
              <div className={styles.sidebarTitle}>{t('home.seeAlso')}</div>
              <TaskLink label={t('home.seeAlsoManagePasswords')} />
              <TaskLink label={t('home.seeAlsoPassport')} />
            </>
          ) : (
            <>
              <div className={styles.sidebarTitle}>{t('detail.relatedTasks')}</div>
              <TaskLink label={t('detail.relManageOther')} onClick={goHome} />
              <TaskLink label={t('detail.relLogon')} />
            </>
          )}
        </aside>

        <main className={styles.main}>
          {view === 'home' && (
            <>
              <div className={styles.mainHeading}>{t('home.pickTask')}</div>
              <div className={styles.taskList}>
                <TaskLink icon={AccountTaskIcon} label={t('home.taskModify')} onClick={() => openDetail(users[0].id)} />
                <TaskLink icon={AccountTaskIcon} label={t('home.taskCreate')} onClick={openCreate} />
                <TaskLink icon={LogonTaskIcon} label={t('home.taskLogon')} />
              </div>

              <div className={styles.separator} />

              <div className={styles.mainSubHeading}>{t('home.orPickAccount')}</div>
              <div className={styles.accountGrid}>
                {users.map((user) => (
                  <button key={user.id} type="button" className={styles.accountTile} onClick={() => openDetail(user.id)}>
                    <Avatar avatar={user.avatar} name={user.name} size={48} />
                    <span className={styles.accountTileText}>
                      <span className={styles.accountTileName}>{user.name}</span>
                      <span className={styles.accountTileType}>
                        {accountTypeLabel(user.isAdmin)}
                        {user.password ? ` , ${t('passwordProtected')}` : ''}
                        {currentUserId === user.id ? ` , ${t('connected')}` : ''}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {view === 'detail' && selectedUser && (
            <>
              <div className={styles.detailHeader}>
                <Avatar avatar={selectedUser.avatar} name={selectedUser.name} size={48} />
                <div className={styles.detailHeaderText}>
                  <div className={styles.detailHeaderName}>{selectedUser.name}</div>
                  <div className={styles.detailHeaderType}>{accountTypeLabel(selectedUser.isAdmin)}</div>
                </div>
              </div>

              <div className={styles.mainHeading}>{t('detail.question', { name: selectedUser.name })}</div>
              <div className={styles.taskList}>
                <TaskLink label={t('detail.changeName')} onClick={openRename} />
                <TaskLink
                  label={selectedUser.password ? t('detail.changePassword') : t('detail.createPassword')}
                  onClick={openPassword}
                />
                <TaskLink label={t('detail.changePicture')} onClick={openPicture} />
                <TaskLink label={t('detail.changeType')} onClick={openType} />
                <TaskLink label={t('detail.deleteAccount')} disabled={!canDelete} onClick={commitDelete} />
              </div>
            </>
          )}

          {view === 'rename' && selectedUser && (
            <>
              <div className={styles.mainHeading}>{t('rename.title', { name: selectedUser.name })}</div>
              <label className={styles.fieldLabel}>{t('rename.label', { name: selectedUser.name })}</label>
              <Input
                value={nameDraft}
                autoFocus
                wrapperClassName={styles.textField}
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitRename();
                }}
              />
              <div className={styles.actionRow}>
                <Button onClick={commitRename} disabled={!nameDraft.trim()}>{t('rename.button')}</Button>
                <Button onClick={() => setView('detail')}>{t('cancel')}</Button>
              </div>
            </>
          )}

          {view === 'picture' && selectedUser && (
            <>
              <div className={styles.mainHeading}>{t('picture.title', { name: selectedUser.name })}</div>
              <div className={styles.avatarPalette}>
                {AVATARS.map((avatarDef) => (
                  <button
                    key={avatarDef.id}
                    type="button"
                    className={`${styles.avatarChoice} ${avatarDraft === avatarDef.id ? styles.avatarChoiceSelected : ''}`}
                    onClick={() => setAvatarDraft(avatarDef.id)}
                  >
                    <Avatar avatar={avatarDef.id} name={selectedUser.name} size={48} />
                  </button>
                ))}
              </div>
              <div className={styles.actionRow}>
                <Button onClick={commitPicture}>{t('picture.button')}</Button>
                <Button onClick={() => setView('detail')}>{t('cancel')}</Button>
              </div>
            </>
          )}

          {view === 'type' && selectedUser && (
            <>
              <div className={styles.mainHeading}>{t('type.title', { name: selectedUser.name })}</div>
              <label className={styles.radioRow}>
                <input type="radio" checked={typeDraft} onChange={() => setTypeDraft(true)} />
                <span className={styles.radioTexts}>
                  <span className={styles.radioTitle}>{t('administrator')}</span>
                  <span className={styles.radioDesc}>{t('type.adminDesc')}</span>
                </span>
              </label>
              <label className={styles.radioRow}>
                <input type="radio" checked={!typeDraft} onChange={() => setTypeDraft(false)} />
                <span className={styles.radioTexts}>
                  <span className={styles.radioTitle}>{t('limited')}</span>
                  <span className={styles.radioDesc}>{t('type.limitedDesc')}</span>
                </span>
              </label>
              <div className={styles.actionRow}>
                <Button onClick={commitType}>{t('type.button')}</Button>
                <Button onClick={() => setView('detail')}>{t('cancel')}</Button>
              </div>
            </>
          )}

          {view === 'password' && selectedUser && (
            <>
              <div className={styles.mainHeading}>{t('password.title', { name: selectedUser.name })}</div>
              <label className={styles.fieldLabel}>{t('password.field')}</label>
              <Input
                type="password"
                value={pw1}
                wrapperClassName={styles.textField}
                onChange={(event) => setPw1(event.target.value)}
              />
              <label className={styles.fieldLabel}>{t('password.confirm')}</label>
              <Input
                type="password"
                value={pw2}
                wrapperClassName={styles.textField}
                onChange={(event) => setPw2(event.target.value)}
              />
              {pwError && <div className={styles.errorText}>{t('password.mismatch')}</div>}
              <div className={styles.actionRow}>
                <Button onClick={commitPassword} disabled={!pw1}>{t('password.button')}</Button>
                <Button onClick={() => setView('detail')}>{t('cancel')}</Button>
              </div>
            </>
          )}

          {view === 'create' && (
            <>
              {createStep === 'name' ? (
                <>
                  <div className={styles.mainHeading}>{t('create.title')}</div>
                  <label className={styles.fieldLabel}>{t('create.nameLabel')}</label>
                  <Input
                    value={createName}
                    autoFocus
                    wrapperClassName={styles.textField}
                    onChange={(event) => setCreateName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && createName.trim()) setCreateStep('type');
                    }}
                  />
                  <div className={styles.createAvatarRow}>
                    <Avatar avatar={createAvatar} name={createName || 'A'} size={48} />
                    <div className={styles.avatarPalette}>
                      {AVATARS.map((avatarDef) => (
                        <button
                          key={avatarDef.id}
                          type="button"
                          className={`${styles.avatarChoice} ${createAvatar === avatarDef.id ? styles.avatarChoiceSelected : ''}`}
                          onClick={() => setCreateAvatar(avatarDef.id)}
                        >
                          <Avatar avatar={avatarDef.id} name={createName || 'A'} size={32} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.actionRow}>
                    <Button onClick={() => setCreateStep('type')} disabled={!createName.trim()}>{t('create.next')}</Button>
                    <Button onClick={goHome}>{t('cancel')}</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.mainHeading}>{t('create.typeTitle')}</div>
                  <label className={styles.radioRow}>
                    <input type="radio" checked={createIsAdmin} onChange={() => setCreateIsAdmin(true)} />
                    <span className={styles.radioTexts}>
                      <span className={styles.radioTitle}>{t('administrator')}</span>
                      <span className={styles.radioDesc}>{t('type.adminDesc')}</span>
                    </span>
                  </label>
                  <label className={styles.radioRow}>
                    <input type="radio" checked={!createIsAdmin} onChange={() => setCreateIsAdmin(false)} />
                    <span className={styles.radioTexts}>
                      <span className={styles.radioTitle}>{t('limited')}</span>
                      <span className={styles.radioDesc}>{t('type.limitedDesc')}</span>
                    </span>
                  </label>
                  <div className={styles.actionRow}>
                    <Button onClick={commitCreate}>{t('create.button')}</Button>
                    <Button onClick={() => setCreateStep('name')}>{t('back')}</Button>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
