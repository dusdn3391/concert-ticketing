import React from 'react';

import { PatternConfig, PatternType } from '@/types/BulkObject';

import styles from '../bulkObject.module.css';

interface PatternSettingsProps {
  patternConfig: PatternConfig;
  setPatternConfig: React.Dispatch<React.SetStateAction<PatternConfig>>;
}

export default function PatternSettings({
  patternConfig,
  setPatternConfig,
}: PatternSettingsProps) {
  const handlePatternTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPatternConfig((prev) => ({
      ...prev,
      pattern: e.target.value as PatternType,
    }));
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>패턴 설정</h3>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>패턴</label>
          <select
            value={patternConfig.pattern}
            onChange={handlePatternTypeChange}
            className={styles.select}
          >
            <option value='circle'>원형</option>
            <option value='line'>직선</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>개수</label>
          <input
            type='number'
            value={patternConfig.count}
            onClick={(e) => e.currentTarget.select()}
            onChange={(e) =>
              setPatternConfig((prev) => ({
                ...prev,
                count: Number(e.target.value),
              }))
            }
            className={styles.input}
            min='1'
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>중심 좌표 X</label>
          <input
            type='number'
            value={patternConfig.centerX}
            onClick={(e) => e.currentTarget.select()}
            onChange={(e) =>
              setPatternConfig((prev) => ({
                ...prev,
                centerX: Number(e.target.value),
              }))
            }
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>중심 좌표 Y</label>
          <input
            type='number'
            value={patternConfig.centerY}
            onClick={(e) => e.currentTarget.select()}
            onChange={(e) =>
              setPatternConfig((prev) => ({
                ...prev,
                centerY: Number(e.target.value),
              }))
            }
            className={styles.input}
          />
        </div>
      </div>

      {/* 패턴별 추가 설정 */}
      {patternConfig.pattern === 'circle' && (
        <div className={styles.field}>
          <label className={styles.label}>반지름</label>
          <input
            type='number'
            value={patternConfig.radius}
            onClick={(e) => e.currentTarget.select()}
            onChange={(e) =>
              setPatternConfig((prev) => ({
                ...prev,
                radius: Number(e.target.value),
              }))
            }
            className={styles.input}
          />
        </div>
      )}

      {patternConfig.pattern === 'line' && (
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>각도 (도)</label>
            <input
              type='number'
              value={patternConfig.angle}
              onClick={(e) => e.currentTarget.select()}
              onChange={(e) =>
                setPatternConfig((prev) => ({
                  ...prev,
                  angle: Number(e.target.value),
                }))
              }
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>간격</label>
            <input
              type='number'
              value={patternConfig.spacing}
              onClick={(e) => e.currentTarget.select()}
              onChange={(e) =>
                setPatternConfig((prev) => ({
                  ...prev,
                  spacing: Number(e.target.value),
                }))
              }
              className={styles.input}
            />
          </div>
        </div>
      )}
    </div>
  );
}
