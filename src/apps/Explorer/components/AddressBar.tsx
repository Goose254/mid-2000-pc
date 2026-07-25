import React, { useEffect, useMemo, useState } from 'react';
import styles from './chrome.module.scss';

import { WindowToolbar } from '@/components/atoms/WindowToolbar/WindowToolbar';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';

import { useExplorer } from '../ExplorerContext';
import { COMPUTER, Location, SPECIAL_PATHS, TRASH, folderLocation, locationIcon } from '../model';
import { ROOT_PATH } from '@/common/fs';

/** Adresse texte affichée pour un emplacement. */
const addressText = (loc: Location): string => {
  switch (loc.kind) {
    case 'computer':
      return 'Poste de travail';
    case 'trash':
      return 'Corbeille';
    case 'folder':
      return loc.path;
  }
};

/** Emplacements connus proposés dans la liste déroulante (favoris rapides). */
const KNOWN_PLACES: { label: string; loc: Location }[] = [
  { label: 'Poste de travail', loc: COMPUTER },
  { label: 'Disque local (C:)', loc: folderLocation(ROOT_PATH) },
  { label: 'Mes documents', loc: folderLocation(SPECIAL_PATHS.myDocuments) },
  { label: 'Mes images', loc: folderLocation(SPECIAL_PATHS.myPictures) },
  { label: 'Ma musique', loc: folderLocation(SPECIAL_PATHS.myMusic) },
  { label: 'Corbeille', loc: TRASH },
];

/** Barre d'adresse : icône + champ éditable navigable + bouton « OK ». */
export const AddressBar: React.FC = () => {
  const { state, navigate, navigatePath } = useExplorer();
  const current = addressText(state.location);
  const [text, setText] = useState(current);

  // Resynchronise le champ à chaque changement d'emplacement.
  useEffect(() => setText(current), [current]);

  const options = useMemo(() => KNOWN_PLACES.map((p) => p.label), []);

  const go = () => navigatePath(text);

  const handleSelect = (label: string) => {
    const place = KNOWN_PLACES.find((p) => p.label === label);
    if (place) navigate(place.loc);
    else navigatePath(label);
  };

  return (
    <WindowToolbar variant="gradient" lastToolbar className={styles.addressToolbar}>
      <div className={styles.addressRow}>
        <span className={styles.addressLabel}>Adresse</span>
        <div className={styles.addressFieldRow}>
          <div className={styles.addressInputShell}>
            <img src={locationIcon(state.location)} alt="" aria-hidden className={styles.addressInputIcon} />
            <Input
              value={text}
              dropdownOptions={options}
              onDropdownValueSelect={handleSelect}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') go();
              }}
              wrapperClassName={styles.addressInputWrapper}
              className={styles.addressInputField}
            />
          </div>
          <Button type="button" size="small" className={styles.addressOkButton} onClick={go}>
            OK
          </Button>
        </div>
      </div>
    </WindowToolbar>
  );
};
