import React from 'react';
import styles from './NetworkTab.module.scss';

import { useTaskManagerStore } from '../../stores/taskManagerStore';
import { GraphCanvas } from './PerfCanvas';

export const TaskManagerNetworkTab: React.FC = () => {
  const netHistory = useTaskManagerStore((state) => state.netHistory);
  const tick = useTaskManagerStore((state) => state.tickCount);

  const currentUsage = netHistory.length > 0 ? netHistory[netHistory.length - 1] : 0;
  // Une décimale, format français (« 0,5 % »).
  const usageLabel = `${currentUsage.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })} %`;

  return (
    <div className={styles.netContent}>
      <fieldset className={styles.box}>
        <legend>Connexion au réseau local</legend>
        <GraphCanvas history={netHistory} tick={tick} color="#ffff00" className={styles.graphCanvas} />
      </fieldset>

      <table className={styles.adapterTable}>
        <thead>
          <tr>
            <th>Carte réseau</th>
            <th>Utilisation du réseau</th>
            <th>Vitesse de la liaison</th>
            <th>État</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Connexion au réseau local</td>
            <td>{usageLabel}</td>
            <td>100 Mbits/s</td>
            <td>Opérationnel</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
