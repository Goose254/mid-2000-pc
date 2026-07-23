import React from 'react';
import styles from './PerformanceTab.module.scss';

import { useTaskManagerStore } from '../../stores/taskManagerStore';
import { formatNumber } from '../../utils/processMetrics';
import { GaugeCanvas, GraphCanvas } from './PerfCanvas';

/** Ligne « libellé : valeur » d'un encadré de compteurs. */
const CounterLine: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className={styles.counterLine}>
    <span>{label}</span>
    <span className={styles.counterValue}>{value}</span>
  </div>
);

export const TaskManagerPerformanceTab: React.FC = () => {
  const metrics = useTaskManagerStore((state) => state.metrics);
  const cpuHistory = useTaskManagerStore((state) => state.cpuHistory);
  const pfHistory = useTaskManagerStore((state) => state.pfHistory);
  const tick = useTaskManagerStore((state) => state.tickCount);
  const commitPeakKo = useTaskManagerStore((state) => state.commitPeakKo);

  const pfUsage = (metrics.commitTotalKo / metrics.commitLimitKo) * 100;
  const kernelTotalKo = metrics.kernelPagedKo + metrics.kernelNonPagedKo;

  return (
    <div className={styles.perfContent}>
      <div className={styles.graphRow}>
        <fieldset className={`${styles.box} ${styles.gaugeBox}`}>
          <legend>Utilisation de l'UC</legend>
          <GaugeCanvas value={metrics.cpuUsage} className={styles.gaugeCanvas} />
          <div className={styles.gaugeValue}>{metrics.cpuUsage} %</div>
        </fieldset>
        <fieldset className={`${styles.box} ${styles.graphBox}`}>
          <legend>Historique de l'utilisation de l'UC</legend>
          <GraphCanvas history={cpuHistory} tick={tick} className={styles.graphCanvas} />
        </fieldset>
      </div>

      <div className={styles.graphRow}>
        <fieldset className={`${styles.box} ${styles.gaugeBox}`}>
          <legend>Fichier d'échange</legend>
          <GaugeCanvas value={pfUsage} className={styles.gaugeCanvas} />
          <div className={styles.gaugeValue}>{Math.round(pfUsage)} %</div>
        </fieldset>
        <fieldset className={`${styles.box} ${styles.graphBox}`}>
          <legend>Historique de l'utilisation du fichier d'échange</legend>
          <GraphCanvas history={pfHistory} tick={tick} className={styles.graphCanvas} />
        </fieldset>
      </div>

      <div className={styles.countersRow}>
        <fieldset className={`${styles.box} ${styles.counterBox}`}>
          <legend>Totaux</legend>
          <CounterLine label="Handles" value={formatNumber(metrics.totalHandles)} />
          <CounterLine label="Threads" value={formatNumber(metrics.totalThreads)} />
          <CounterLine label="Processus" value={formatNumber(metrics.processCount)} />
        </fieldset>
        <fieldset className={`${styles.box} ${styles.counterBox}`}>
          <legend>Mémoire physique (Ko)</legend>
          <CounterLine label="Total" value={formatNumber(metrics.physicalTotalKo)} />
          <CounterLine label="Disponible" value={formatNumber(metrics.physicalAvailableKo)} />
          <CounterLine label="Cache système" value={formatNumber(metrics.systemCacheKo)} />
        </fieldset>
      </div>

      <div className={styles.countersRow}>
        <fieldset className={`${styles.box} ${styles.counterBox}`}>
          <legend>Charge dédiée (Ko)</legend>
          <CounterLine label="Total" value={formatNumber(metrics.commitTotalKo)} />
          <CounterLine label="Limite" value={formatNumber(metrics.commitLimitKo)} />
          <CounterLine label="Maximum" value={formatNumber(commitPeakKo)} />
        </fieldset>
        <fieldset className={`${styles.box} ${styles.counterBox}`}>
          <legend>Mémoire du noyau (Ko)</legend>
          <CounterLine label="Total" value={formatNumber(kernelTotalKo)} />
          <CounterLine label="Paginée" value={formatNumber(metrics.kernelPagedKo)} />
          <CounterLine label="Non paginée" value={formatNumber(metrics.kernelNonPagedKo)} />
        </fieldset>
      </div>
    </div>
  );
};
