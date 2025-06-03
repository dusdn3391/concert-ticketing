import React from 'react';

import { GridConfig } from '@/types/BulkObject';

import styles from '../bulkObject.module.css';

interface GridSettingsProps {
  gridConfig: GridConfig;
  setGridConfig: React.Dispatch<React.SetStateAction<GridConfig>>;
}

export default function GridSettings({ gridConfig, setGridConfig }: GridSettingsProps) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>그리드 설정</h3>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>행 수</label>
          <input
            type='number'
            value={gridConfig.rows}
            onClick={(e) => e.currentTarget.select()}
            onChange={(e) =>
              setGridConfig((prev) => ({
                ...prev,
                rows: Number(e.target.value),
              }))
            }
            className={styles.input}
            min='1'
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>열 수</label>
          <input
            type='number'
            value={gridConfig.cols}
            onClick={(e) => e.currentTarget.select()}
            onChange={(e) =>
              setGridConfig((prev) => ({
                ...prev,
                cols: Number(e.target.value),
              }))
            }
            className={styles.input}
            min='1'
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>가로 간격</label>
          <input
            type='number'
            value={gridConfig.spacingX}
            onClick={(e) => e.currentTarget.select()}
            onChange={(e) =>
              setGridConfig((prev) => ({
                ...prev,
                spacingX: Number(e.target.value),
              }))
            }
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>세로 간격</label>
          <input
            type='number'
            value={gridConfig.spacingY}
            onClick={(e) => e.currentTarget.select()}
            onChange={(e) =>
              setGridConfig((prev) => ({
                ...prev,
                spacingY: Number(e.target.value),
              }))
            }
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>시작 좌표 X</label>
          <input
            type='number'
            value={gridConfig.startX}
            onClick={(e) => e.currentTarget.select()}
            onChange={(e) =>
              setGridConfig((prev) => ({
                ...prev,
                startX: Number(e.target.value),
              }))
            }
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>시작 좌표 Y</label>
          <input
            type='number'
            value={gridConfig.startY}
            onClick={(e) => e.currentTarget.select()}
            onChange={(e) =>
              setGridConfig((prev) => ({
                ...prev,
                startY: Number(e.target.value),
              }))
            }
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.info}>
        총 {gridConfig.rows * gridConfig.cols}개 객체가 생성됩니다.
      </div>
    </div>
  );
}
