import React, { useState, useCallback } from 'react';
import * as fabric from 'fabric';

import { ObjectConfig, GridConfig, PatternConfig, TabType } from '@/types/BulkObject';

import ObjectSettings from './options/ObjectSettings';
import GridSettings from './options/GridSettings';
import PatternSettings from './options/PatternSettings';
import styles from './bulkObject.module.css';

interface BulkObjectCreatorProps {
  canvas: fabric.Canvas;
}

export default function BulkObjectCreator({ canvas }: BulkObjectCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('grid');

  // 객체 설정 (초기 상태)
  const [objectConfig, setObjectConfig] = useState<ObjectConfig>({
    type: 'rect',
    fill: '#3b82f6',
    stroke: '#1e40af',
    strokeWidth: 1,
    width: 60,
    height: 60,
    radius: 40,
    borderRadius: 0,
    text: 'Text',
    fontSize: 16,
    includeText: false,
    textContent: '텍스트',
    textColor: '#ffffff',
    textFontSize: 14,
  });

  // 그리드 설정 (초기 상태)
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    rows: 3,
    cols: 3,
    spacingX: 100,
    spacingY: 100,
    startX: 100,
    startY: 100,
  });

  // 패턴 설정 (초기 상태)
  const [patternConfig, setPatternConfig] = useState<PatternConfig>({
    pattern: 'circle',
    count: 8,
    centerX: 300,
    centerY: 300,
    radius: 150,
    angle: 0,
    spacing: 80,
    areaWidth: 400,
    areaHeight: 300,
  });

  // Settings 호환 객체 생성 함수
  const createObject = useCallback(
    (x: number, y: number, index: number): fabric.FabricObject => {
      const id = `bulk_${objectConfig.type}_${Date.now()}_${index}`;

      if (objectConfig.type === 'text') {
        const textObj = new fabric.IText(`${objectConfig.text} ${index + 1}`, {
          left: x,
          top: y,
          fontSize: objectConfig.fontSize,
          fill: objectConfig.fill,
          stroke: objectConfig.stroke,
          strokeWidth: objectConfig.strokeWidth,
        }) as fabric.IText & { id: string };

        textObj.id = id;
        return textObj as fabric.FabricObject;
      }

      // 도형 객체 생성
      let shape: fabric.FabricObject & { id: string };

      if (objectConfig.type === 'rect') {
        shape = new fabric.Rect({
          left: 0,
          top: 0,
          width: objectConfig.width,
          height: objectConfig.height,
          fill: objectConfig.fill,
          stroke: objectConfig.stroke,
          strokeWidth: objectConfig.strokeWidth,
          rx: objectConfig.borderRadius,
          ry: objectConfig.borderRadius,
          strokeUniform: true, // Settings에서 사용하는 속성
        }) as fabric.Rect & { id: string };
        shape.id = `${id}_rect`;
      } else {
        shape = new fabric.Circle({
          left: 0,
          top: 0,
          radius: objectConfig.radius,
          fill: objectConfig.fill,
          stroke: objectConfig.stroke,
          strokeWidth: objectConfig.strokeWidth,
          strokeUniform: true, // Settings에서 사용하는 속성
        }) as fabric.Circle & { id: string };
        shape.id = `${id}_circle`;
      }

      // 텍스트를 포함하지 않는 경우 도형만 반환
      if (!objectConfig.includeText) {
        shape.set({
          left: x,
          top: y,
        });
        shape.id = id; // 단일 객체일 때는 메인 id 사용
        return shape;
      }

      // 도형 내부에 텍스트 추가
      const textObj = new fabric.IText(`${objectConfig.textContent} ${index + 1}`, {
        fontSize: objectConfig.textFontSize,
        fill: objectConfig.textColor,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        editable: true,
        selectable: true,
        left: 0,
        top: 0,
      }) as fabric.IText & { id: string };

      textObj.id = `${id}_text`;

      // 도형의 중심에 텍스트 배치
      if (objectConfig.type === 'rect') {
        const rectWidth = objectConfig.width || 60;
        const rectHeight = objectConfig.height || 60;
        textObj.set({
          left: rectWidth / 2,
          top: rectHeight / 2,
        });
      } else if (objectConfig.type === 'circle') {
        const circleRadius = objectConfig.radius || 40;
        textObj.set({
          left: circleRadius,
          top: circleRadius,
        });
      }

      // 도형과 텍스트를 그룹으로 묶기
      const group = new fabric.Group([shape, textObj as fabric.FabricObject], {
        left: x,
        top: y,
        originX: 'center',
        originY: 'center',
        selectable: true,
        strokeUniform: true,
        subTargetCheck: true, // Settings의 더블클릭과 그룹 내 객체 접근을 위해 필수
      }) as fabric.Group & { id: string };

      group.id = id;

      // Settings 호환 더블클릭 이벤트 - Settings의 handleDoubleClick과 동일한 로직
      group.on('mousedblclick', (e: any) => {
        e.e?.preventDefault();
        e.e?.stopPropagation();

        // Settings의 더블클릭 핸들러와 동일한 동작
        if (group.subTargetCheck && e.subTargets) {
          const subTarget = e.subTargets[0];
          if (subTarget instanceof fabric.IText) {
            canvas.setActiveObject(subTarget as fabric.Object);
            subTarget.enterEditing();
            subTarget.selectAll();
          }
        }
      });

      return group;
    },
    [objectConfig, canvas],
  );

  // 그리드 패턴으로 생성
  const createGridObjects = useCallback(() => {
    const objects: fabric.FabricObject[] = [];
    let index = 0;

    for (let row = 0; row < gridConfig.rows; row++) {
      for (let col = 0; col < gridConfig.cols; col++) {
        const x = gridConfig.startX + col * gridConfig.spacingX;
        const y = gridConfig.startY + row * gridConfig.spacingY;

        objects.push(createObject(x, y, index));
        index++;
      }
    }

    return objects;
  }, [gridConfig, createObject]);

  // 원형 패턴으로 생성
  const createCirclePattern = useCallback(() => {
    const objects: fabric.FabricObject[] = [];
    const angleStep = (2 * Math.PI) / patternConfig.count;

    for (let i = 0; i < patternConfig.count; i++) {
      const angle = i * angleStep;
      const x = patternConfig.centerX + Math.cos(angle) * (patternConfig.radius || 100);
      const y = patternConfig.centerY + Math.sin(angle) * (patternConfig.radius || 100);

      objects.push(createObject(x, y, i));
    }

    return objects;
  }, [patternConfig, createObject]);

  // 직선 패턴으로 생성
  const createLinePattern = useCallback(() => {
    const objects: fabric.FabricObject[] = [];
    const angle = ((patternConfig.angle || 0) * Math.PI) / 180;
    const spacing = patternConfig.spacing || 60;

    for (let i = 0; i < patternConfig.count; i++) {
      const distance = i * spacing;
      const x = patternConfig.centerX + Math.cos(angle) * distance;
      const y = patternConfig.centerY + Math.sin(angle) * distance;

      objects.push(createObject(x, y, i));
    }

    return objects;
  }, [patternConfig, createObject]);

  // 패턴별 객체 생성
  const createPatternObjects = useCallback(() => {
    switch (patternConfig.pattern) {
      case 'circle':
        return createCirclePattern();
      case 'line':
        return createLinePattern();
      default:
        return [];
    }
  }, [patternConfig, createCirclePattern, createLinePattern]);

  // Settings 호환성을 보장하는 객체 추가 함수
  const addObjectsToCanvas = useCallback(
    (objects: fabric.FabricObject[]) => {
      objects.forEach((obj) => {
        canvas.add(obj);
      });
      canvas.renderAll();
    },
    [canvas],
  );

  // 그리드 생성 실행
  const handleCreateGrid = useCallback(() => {
    const objects = createGridObjects();
    addObjectsToCanvas(objects);
    setIsOpen(false);
  }, [createGridObjects, addObjectsToCanvas]);

  // 패턴 생성 실행
  const handleCreatePattern = useCallback(() => {
    const objects = createPatternObjects();
    addObjectsToCanvas(objects);
    setIsOpen(false);
  }, [createPatternObjects, addObjectsToCanvas]);

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className={styles.openButton}>
        대량 객체 생성
      </button>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>대량 객체 생성</h2>
          <button onClick={() => setIsOpen(false)} className={styles.closeButton}>
            ✕
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className={styles.tabContainer}>
          <button
            onClick={() => setActiveTab('grid')}
            className={`${styles.tab} ${activeTab === 'grid' ? styles.activeTab : ''}`}
          >
            그리드
          </button>
          <button
            onClick={() => setActiveTab('pattern')}
            className={`${styles.tab} ${activeTab === 'pattern' ? styles.activeTab : ''}`}
          >
            패턴
          </button>
        </div>

        {/* 객체 설정 */}
        <ObjectSettings objectConfig={objectConfig} setObjectConfig={setObjectConfig} />

        {/* 그리드 설정 */}
        {activeTab === 'grid' && (
          <GridSettings gridConfig={gridConfig} setGridConfig={setGridConfig} />
        )}

        {/* 패턴 설정 */}
        {activeTab === 'pattern' && (
          <PatternSettings
            patternConfig={patternConfig}
            setPatternConfig={setPatternConfig}
          />
        )}

        {/* 버튼 */}
        <div className={styles.buttonContainer}>
          <button onClick={() => setIsOpen(false)} className={styles.cancelButton}>
            취소
          </button>

          <button
            onClick={activeTab === 'grid' ? handleCreateGrid : handleCreatePattern}
            className={styles.createButton}
          >
            생성
          </button>
        </div>

        {/* 사용법 안내 */}
        {(objectConfig.type === 'rect' || objectConfig.type === 'circle') &&
          objectConfig.includeText && (
            <div
              className={styles.info}
              style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}
            >
              💡 Tip: 생성된 도형을 더블클릭하면 텍스트를 편집할 수 있습니다.
            </div>
          )}
      </div>
    </div>
  );
}
