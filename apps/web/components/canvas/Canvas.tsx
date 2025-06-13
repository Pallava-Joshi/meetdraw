"use client";

import { renderDraws } from "@/lib/canvas/drawFunctions";
import {
  moveDraw,
  resizeDraw,
  handleShapeSelectionBox,
  calculateFarthestPoints,
} from "@/lib/canvas/updateFunctions";
import {
  getDrawAtPosition,
  hoverOverSelectionBox,
} from "@/lib/canvas/selectFunctions";
import { Action, Draw } from "@/types";
import { Button } from "@workspace/ui/components/button";
import { useEffect, useRef, useState } from "react";
import { BsFonts } from "react-icons/bs";
import {
  PiArrowRight,
  PiCircle,
  PiCircleFill,
  PiCursor,
  PiCursorFill,
  PiDiamond,
  PiDiamondFill,
  PiEraser,
  PiEraserFill,
  PiLineVertical,
  PiLineVerticalLight,
  PiLineVerticalThin,
  PiMinus,
  PiPencil,
  PiPencilFill,
  PiPlus,
  PiSquare,
  PiSquareFill,
} from "react-icons/pi";
import { LiaHandPaper, LiaHandRock } from "react-icons/lia";
import {
  performRedo,
  performUndo,
  pushToUndoRedoArray,
} from "@/lib/canvas/actionRelatedFunctions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { TbCancel, TbZoom } from "react-icons/tb";
import { MdOutlineHorizontalRule } from "react-icons/md";
import { GrRedo, GrUndo } from "react-icons/gr";

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeAction, setActiveAction] = useState<
    "select" | "move" | "draw" | "resize" | "edit" | "erase" | "pan" | "zoom"
  >("select");
  const [activeShape, setActiveShape] = useState<
    "rectangle" | "diamond" | "circle" | "line" | "arrow" | "text" | "freeHand"
  >("rectangle");
  const [selectedShape, setSelectedShape] = useState<
    | "rectangle"
    | "diamond"
    | "circle"
    | "line"
    | "arrow"
    | "text"
    | "freeHand"
    | null
  >(null);
  const [activeStrokeStyle, setActiveStrokeStyle] = useState<string>("#eeeeee");
  const [activeFillStyle, setActiveFillStyle] = useState<string>("#eeeeee00");
  const [activeLineWidth, setActiveLineWidth] = useState<number>(2);
  const [activeFont, setActiveFont] = useState<string>("Arial");
  const [activeFontSize, setActiveFontSize] = useState<string>("20");
  const panOffset = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const activeDraw = useRef<Draw>(null);
  const selectedDraw = useRef<Draw>(null);
  const originalDrawState = useRef<Draw>(null);
  const modifiedDrawState = useRef<Draw>(null);
  const movingOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartPoint = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const scale = useRef<number>(1);
  const intialPointsForFreeHandMove = useRef<{
    initialPoint: { x: number; y: number };
    originalPoints: { x: number; y: number }[];
  } | null>(null);
  const resizingInfo = useRef<
    | "topLeft"
    | "topRight"
    | "bottomRight"
    | "bottomLeft"
    | "left"
    | "right"
    | "top"
    | "bottom"
    | `point-${number}`
    | null
  >(null);
  const farthestPointsInfoForLineAndArror = useRef<{
    farthestLeftPoint: { point: "start" | "end" | "point"; x: number };
    farthestRightPoint: { point: "start" | "end" | "point"; x: number };
    farthestTopPoint: { point: "start" | "end" | "point"; y: number };
    farthestBottomPoint: { point: "start" | "end" | "point"; y: number };
  } | null>(null);
  const shapeSelectionBox = useRef<Draw>(null);
  const isErasing = useRef<boolean>(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const currentX = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);
  const textInp = useRef<string>("");
  const undoRedoArrayRef = useRef<Action[]>([]);
  const editCounterRef = useRef<number>(0);
  const undoRedoIndexRef = useRef<number>(-1);
  const toErase = useRef<Draw[]>([]);
  const diagrams = useRef<Draw[]>([]);

  const updateUndoRedoState = () => {
    setCanUndo(undoRedoIndexRef.current >= 0);
    setCanRedo(undoRedoIndexRef.current < undoRedoArrayRef.current.length - 1);
  };

  const activeShapeRef = useRef(activeShape);
  const selectedShapeRef = useRef(selectedShape);
  const activeActionRef = useRef(activeAction);
  const isDraggingRef = useRef<boolean>(isDragging);
  const activeStrokeStyleRef = useRef<string>(activeStrokeStyle);
  const activeFillStyleRef = useRef<string>(activeFillStyle);
  const activeLineWidthRef = useRef<number>(activeLineWidth);
  const activeFontRef = useRef<string>(activeFont);
  const activeFontSizeRef = useRef<string>(activeFontSize);
  useEffect(() => {
    activeShapeRef.current = activeShape;
    activeActionRef.current = activeAction;
    selectedShapeRef.current = selectedShape;
    isDraggingRef.current = isDragging;
    activeStrokeStyleRef.current = activeStrokeStyle;
    activeFillStyleRef.current = activeFillStyle;
    activeLineWidthRef.current = activeLineWidth;
    activeFontRef.current = activeFont;
    activeFontSizeRef.current = activeFontSize;

    if (canvasRef.current) {
      canvasRef.current.focus();
      switch (activeActionRef.current) {
        case "pan":
          if (isDraggingRef.current) {
            canvasRef.current.style.cursor = "grabbing";
          } else {
            canvasRef.current.style.cursor = "grab";
          }
          break;
        case "zoom":
          canvasRef.current.style.cursor = "zoom-in";
          break;
        case "select":
          canvasRef.current.style.cursor = "default";
          break;
        case "move":
          canvasRef.current.style.cursor = "move";
          break;
        case "draw":
          canvasRef.current.style.cursor = "crosshair";
          break;
        case "resize":
          canvasRef.current.style.cursor = "default";
          break;
        case "edit":
          canvasRef.current.style.cursor = "text";
          break;
        case "erase":
          canvasRef.current.style.cursor = "cell";
          break;
      }
    }

    if (selectedDraw.current) {
      selectedDraw.current.fillStyle = activeFillStyleRef.current;
      selectedDraw.current.strokeStyle = activeStrokeStyleRef.current;
      selectedDraw.current.lineWidth = activeLineWidthRef.current;
      selectedDraw.current.font = activeFontRef.current;
      if (
        selectedDraw.current.fontSize === "20" ||
        selectedDraw.current.fontSize === "40" ||
        selectedDraw.current.fontSize === "60"
      ) {
        selectedDraw.current.fontSize = activeFontSizeRef.current;
      }
    }
  }, [
    activeShape,
    activeAction,
    isDragging,
    selectedShape,
    activeStrokeStyle,
    activeFillStyle,
    activeLineWidth,
    activeFont,
    activeFontSize,
  ]);

  function executeUndo() {
    const changes = performUndo(
      undoRedoArrayRef.current,
      undoRedoIndexRef.current,
      diagrams.current
    );

    if (shapeSelectionBox.current && canvasRef.current) {
      shapeSelectionBox.current = null;
    }

    diagrams.current = changes.diagrams;
    undoRedoArrayRef.current = changes.undoRedoArray;
    undoRedoIndexRef.current = changes.undoRedoIndex;
    updateUndoRedoState();
  }

  function executeRedo() {
    const changes = performRedo(
      undoRedoArrayRef.current,
      undoRedoIndexRef.current,
      diagrams.current
    );

    if (shapeSelectionBox.current && canvasRef.current) {
      shapeSelectionBox.current = null;
    }

    diagrams.current = changes.diagrams;
    undoRedoArrayRef.current = changes.undoRedoArray;
    undoRedoIndexRef.current = changes.undoRedoIndex;
    updateUndoRedoState();
  }

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // shortcuts
    const handleShortcuts = (event: KeyboardEvent) => {
      if (
        activeDraw.current?.shape !== "text" &&
        selectedDraw.current?.shape !== "text"
      ) {
        switch (event.key) {
          case "1":
          case "s":
          case "S":
            setActiveAction("select");
            break;
          case "2":
          case "r":
          case "R":
            setActiveAction("draw");
            setActiveShape("rectangle");
            break;
          case "3":
          case "d":
          case "D":
            setActiveAction("draw");
            setActiveShape("diamond");
            break;
          case "4":
          case "c":
          case "C":
            setActiveAction("draw");
            setActiveShape("circle");
            break;
          case "5":
          case "l":
          case "L":
            setActiveAction("draw");
            setActiveShape("line");
            break;
          case "6":
          case "a":
          case "A":
            setActiveAction("draw");
            setActiveShape("arrow");
            break;
          case "7":
          case "f":
          case "F":
            setActiveAction("draw");
            setActiveShape("freeHand");
            break;
          case "8":
          case "t":
          case "T":
            setActiveAction("draw");
            setActiveShape("text");
            break;
          case "9":
          case "e":
          case "E":
            setActiveAction("erase");
            break;
        }

        if (event.shiftKey && !event.metaKey) {
          setActiveAction("pan");
          return;
        }

        if (event.ctrlKey && !event.shiftKey) {
          setActiveAction("zoom");
          if (canvasRef.current) {
            canvasRef.current.style.cursor = "zoom-in";
          }
          return;
        }

        if (event.metaKey && !event.shiftKey && event.key === "z") {
          event.preventDefault();
          executeUndo();
        }

        if (
          (event.metaKey && event.shiftKey && event.key === "z") ||
          (event.metaKey && event.key === "y")
        ) {
          event.preventDefault();
          executeRedo();
        }
      }
    };

    const handleShortcutsClose = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        setActiveAction("select");
        return;
      }
      if (event.key === "Control") {
        setActiveAction("select");
        if (canvasRef.current) {
          canvasRef.current.style.cursor = "default";
        }
        return;
      }
    };

    document.addEventListener("keydown", (event) => handleShortcuts(event));
    document.addEventListener("keyup", (event) => handleShortcutsClose(event));
  }, []);

  const zoomToPoint = (newScale: number) => {
    const canvasCurrent = canvasRef.current;
    if (!canvasCurrent) return;

    const clampedScale = Math.max(0.1, Math.min(newScale, 10));

    const screenCenterX = canvasCurrent.width / 2;
    const screenCenterY = canvasCurrent.height / 2;

    const worldPointX = (screenCenterX - panOffset.current.x) / scale.current;
    const worldPointY = (screenCenterY - panOffset.current.y) / scale.current;

    panOffset.current.x = screenCenterX - worldPointX * clampedScale;
    panOffset.current.y = screenCenterY - worldPointY * clampedScale;

    scale.current = clampedScale;
    setZoomLevel(clampedScale);
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvasCurrent = canvasRef.current;

    const ctx = canvasCurrent.getContext("2d");
    if (!ctx) return;
    canvasCurrent.focus();

    const renderInterval = setInterval(() => {
      renderDraws(
        ctx,
        canvasCurrent,
        diagrams.current,
        activeDraw.current,
        shapeSelectionBox.current,
        activeActionRef.current,
        selectedDraw.current,
        toErase.current,
        panOffset.current,
        scale.current
      );
    }, 15);

    const getMousePosition = (event: MouseEvent) => {
      return {
        offsetX: (event.offsetX - panOffset.current.x) / scale.current,
        offsetY: (event.offsetY - panOffset.current.y) / scale.current,
      };
    };

    const handleMouseDown = (event: MouseEvent) => {
      setIsDragging(true);
      if (activeActionRef.current === "pan") {
        panStartPoint.current = { x: event.offsetX, y: event.offsetY };
        return;
      }

      const { offsetX, offsetY } = getMousePosition(event);

      if (activeActionRef.current === "select") {
        const draw = getDrawAtPosition(offsetX, offsetY, diagrams.current, ctx);

        const hoveredSelectionBox = hoverOverSelectionBox(
          shapeSelectionBox.current!,
          offsetX,
          offsetY
        );

        if (draw?.shape === "text") {
          currentX.current = offsetX;
          currentY.current = offsetY;
        }

        if (draw && !hoveredSelectionBox?.position.includes("point")) {
          shapeSelectionBox.current = handleShapeSelectionBox(draw, ctx);
          setActiveAction("move");
          movingOffset.current = {
            x: offsetX - draw.startX!,
            y: offsetY - draw.startY!,
          };
          intialPointsForFreeHandMove.current = {
            initialPoint: {
              x: offsetX,
              y: offsetY,
            },
            originalPoints: draw.points
              ? JSON.parse(JSON.stringify(draw.points))
              : [],
          };
          selectedDraw.current = draw;
          setSelectedShape(draw.shape);
          originalDrawState.current = JSON.parse(JSON.stringify(draw));
        } else if (hoveredSelectionBox) {
          setActiveAction("resize");
          resizingInfo.current = hoveredSelectionBox.position;
          farthestPointsInfoForLineAndArror.current = calculateFarthestPoints(
            selectedDraw.current!
          );
          intialPointsForFreeHandMove.current = {
            initialPoint: {
              x: offsetX,
              y: offsetY,
            },
            originalPoints: selectedDraw.current!.points
              ? JSON.parse(JSON.stringify(selectedDraw.current!.points))
              : [],
          };
          originalDrawState.current = JSON.parse(
            JSON.stringify(selectedDraw.current)
          );
        } else {
          setActiveAction("select");
          editCounterRef.current = 0;
          selectedDraw.current = null;
          setSelectedShape(null);
          shapeSelectionBox.current = null;
        }
      }

      if (activeActionRef.current === "edit") {
        if (selectedDraw.current && selectedDraw.current.shape === "text") {
          diagrams.current.push(selectedDraw.current);
          const { undoRedoArray, undoRedoIndex } = pushToUndoRedoArray(
            {
              type: "edit",
              originalDraw: originalDrawState.current,
              modifiedDraw: JSON.parse(JSON.stringify(selectedDraw.current!)),
            },
            undoRedoArrayRef.current,
            undoRedoIndexRef.current
          );
          undoRedoArrayRef.current = undoRedoArray;
          undoRedoIndexRef.current = undoRedoIndex;
          updateUndoRedoState();
          textInp.current = "";
          selectedDraw.current = null;
          setSelectedShape(null);
          shapeSelectionBox.current = null;
          setActiveAction("select");
          return;
        }
      }

      if (activeActionRef.current === "erase") {
        isErasing.current = true;
      }

      if (activeActionRef.current === "draw") {
        if (activeDraw.current && activeDraw.current.shape === "text") {
          diagrams.current.push(activeDraw.current);
          const { undoRedoArray, undoRedoIndex } = pushToUndoRedoArray(
            {
              type: "create",
              originalDraw: null,
              modifiedDraw: JSON.parse(JSON.stringify(activeDraw.current!)),
            },
            undoRedoArrayRef.current,
            undoRedoIndexRef.current
          );
          undoRedoArrayRef.current = undoRedoArray;
          undoRedoIndexRef.current = undoRedoIndex;
          updateUndoRedoState();
          textInp.current = "";
          activeDraw.current = null;
          shapeSelectionBox.current = null;
          setActiveAction("select");
          return;
        }

        const currentActiveShape = activeShapeRef.current;
        const isDrawing = currentActiveShape === "freeHand";
        const isLineOrArrow =
          currentActiveShape === "line" || currentActiveShape === "arrow";
        const isText = currentActiveShape === "text";
        startX.current = offsetX;
        startY.current = offsetY;

        activeDraw.current = {
          id: Date.now().toString() /* TODO: Add userId to the id to make it unique */,
          shape: currentActiveShape,
          strokeStyle: activeStrokeStyleRef.current,
          fillStyle: isText
            ? activeStrokeStyleRef.current
            : isDrawing
              ? "transparent"
              : activeFillStyleRef.current,
          lineWidth: activeLineWidthRef.current,
          points:
            isDrawing || isLineOrArrow
              ? [{ x: startX.current!, y: startY.current! }]
              : undefined,
          startX: isDrawing ? undefined : startX.current!,
          startY: isDrawing ? undefined : startY.current!,
          text: isText ? textInp.current! : undefined,
          font: activeFontRef.current,
          fontSize: activeFontSizeRef.current,
        };

        if (isText) {
          shapeSelectionBox.current = handleShapeSelectionBox(
            activeDraw.current!,
            ctx
          );
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const canvasCurrent = canvasRef.current!;
      if (activeActionRef.current === "pan") {
        if (isDraggingRef.current) {
          canvasCurrent.style.cursor = "grabbing";
          const dx = event.offsetX - panStartPoint.current.x;
          const dy = event.offsetY - panStartPoint.current.y;
          panOffset.current.x += dx;
          panOffset.current.y += dy;
          panStartPoint.current.x = event.offsetX;
          panStartPoint.current.y = event.offsetY;
        } else {
          canvasCurrent.style.cursor = "grab";
        }
        return;
      }

      const { offsetX, offsetY } = getMousePosition(event);

      if (activeActionRef.current === "select") {
        const hoveredDraw = getDrawAtPosition(
          offsetX,
          offsetY,
          diagrams.current,
          ctx
        );

        const hoveredSelectionBox = hoverOverSelectionBox(
          shapeSelectionBox.current,
          offsetX,
          offsetY
        );

        canvasCurrent.style.cursor = hoveredSelectionBox
          ? hoveredSelectionBox.cursor
          : hoveredDraw
            ? "move"
            : "default";
        return;
      }

      if (activeActionRef.current === "resize") {
        const hoveredSelectionBox = hoverOverSelectionBox(
          shapeSelectionBox.current!,
          offsetX,
          offsetY
        );

        canvasCurrent.style.cursor = hoveredSelectionBox?.cursor || "default";

        const draw = resizeDraw(
          resizingInfo.current!,
          offsetX,
          offsetY,
          selectedDraw.current!,
          diagrams.current,
          farthestPointsInfoForLineAndArror.current,
          intialPointsForFreeHandMove.current
        );

        if (!draw) return;

        modifiedDrawState.current = JSON.parse(JSON.stringify(draw));
        shapeSelectionBox.current = handleShapeSelectionBox(draw, ctx);

        return;
      }

      if (activeActionRef.current === "move") {
        canvasCurrent.style.cursor = "move";
        const draw = moveDraw(
          offsetX,
          offsetY,
          movingOffset.current.x,
          movingOffset.current.y,
          selectedDraw.current!,
          diagrams.current,
          intialPointsForFreeHandMove.current
        );

        modifiedDrawState.current = JSON.parse(JSON.stringify(draw));

        if (!draw) return;

        shapeSelectionBox.current = handleShapeSelectionBox(draw, ctx);
      }

      if (activeActionRef.current === "draw") {
        shapeSelectionBox.current = null;
        if (activeShapeRef.current === "text") {
          canvasCurrent.style.cursor = "text";
        } else {
          canvasCurrent.style.cursor = "crosshair";
        }
        if (!activeDraw.current) return;

        currentX.current = offsetX;
        currentY.current = offsetY;

        if (activeDraw.current.shape === "freeHand") {
          activeDraw.current.points?.push({
            x: currentX.current,
            y: currentY.current,
          });
        } else if (activeDraw.current.shape !== "text") {
          activeDraw.current.endX = currentX.current;
          activeDraw.current.endY = currentY.current;
          if (
            activeDraw.current.shape === "line" ||
            activeDraw.current.shape === "arrow"
          ) {
            activeDraw.current.points = [
              {
                x: (activeDraw.current.startX! + activeDraw.current.endX!) / 2,
                y: (activeDraw.current.startY! + activeDraw.current.endY!) / 2,
              },
            ];
          }
        } else {
          selectedDraw.current = activeDraw.current;
          shapeSelectionBox.current = handleShapeSelectionBox(
            activeDraw.current,
            ctx
          );
          setSelectedShape(activeDraw.current.shape);
        }
      }

      if (activeActionRef.current === "erase") {
        canvasCurrent.style.cursor = "cell";
      }

      if (activeActionRef.current === "erase" && isErasing.current) {
        const hoveredOver = getDrawAtPosition(
          offsetX,
          offsetY,
          diagrams.current,
          ctx
        );

        if (hoveredOver) {
          if (!toErase.current.includes(hoveredOver)) {
            toErase.current.push(hoveredOver);
          }
        }
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      const canvasCurrent = canvasRef.current!;
      setIsDragging(false);

      if (activeActionRef.current === "pan") {
        canvasCurrent.style.cursor = "grab";
        return;
      }
      const { offsetX, offsetY } = getMousePosition(event);

      if (activeActionRef.current === "select") {
        canvasCurrent.style.cursor = "default";
        return;
      }

      if (activeActionRef.current === "erase" && isErasing.current) {
        diagrams.current = diagrams.current.filter(
          (draw) => !toErase.current.includes(draw)
        );
        toErase.current.forEach((draw) => {
          const { undoRedoArray, undoRedoIndex } = pushToUndoRedoArray(
            {
              type: "erase",
              originalDraw: draw,
              modifiedDraw: null,
            },
            undoRedoArrayRef.current,
            undoRedoIndexRef.current
          );
          undoRedoArrayRef.current = undoRedoArray;
          undoRedoIndexRef.current = undoRedoIndex;
          updateUndoRedoState();
        });
        isErasing.current = false;
        toErase.current = [];
        return;
      }

      if (activeActionRef.current === "resize") {
        if (!selectedDraw.current) return;
        if (
          selectedDraw.current!.shape === "rectangle" ||
          selectedDraw.current!.shape === "diamond" ||
          selectedDraw.current!.shape === "circle"
        ) {
          if (selectedDraw.current!.endX! < selectedDraw.current!.startX!) {
            let a = selectedDraw.current!.endX;
            selectedDraw.current!.endX = selectedDraw.current!.startX;
            selectedDraw.current!.startX = a;
          }
          if (selectedDraw.current!.endY! < selectedDraw.current!.startY!) {
            let a = selectedDraw.current!.endY;
            selectedDraw.current!.endY = selectedDraw.current!.startY;
            selectedDraw.current!.startY = a;
          }
        }
        const { undoRedoArray, undoRedoIndex } = pushToUndoRedoArray(
          {
            type: "resize",
            originalDraw: originalDrawState.current,
            modifiedDraw: JSON.parse(JSON.stringify(modifiedDrawState.current)),
          },
          undoRedoArrayRef.current,
          undoRedoIndexRef.current
        );
        undoRedoArrayRef.current = undoRedoArray;
        undoRedoIndexRef.current = undoRedoIndex;
        updateUndoRedoState();
        setActiveAction("select");
        resizingInfo.current = null;
        return;
      }

      if (activeActionRef.current === "move") {
        if (
          currentX.current === offsetX &&
          currentY.current === offsetY &&
          selectedDraw.current?.shape === "text"
        ) {
          if (editCounterRef.current < 1) {
            editCounterRef.current++;
            setActiveAction("select");
          } else {
            setActiveAction("edit");
            originalDrawState.current = JSON.parse(
              JSON.stringify(selectedDraw.current)
            );
            canvasCurrent.style.cursor = "text";
            editCounterRef.current = 0;
          }
          return;
        }
        const { undoRedoArray, undoRedoIndex } = pushToUndoRedoArray(
          {
            type: "move",
            originalDraw: originalDrawState.current,
            modifiedDraw: JSON.parse(JSON.stringify(modifiedDrawState.current)),
          },
          undoRedoArrayRef.current,
          undoRedoIndexRef.current
        );
        undoRedoArrayRef.current = undoRedoArray;
        undoRedoIndexRef.current = undoRedoIndex;
        updateUndoRedoState();
        setActiveAction("select");
      }

      if (activeActionRef.current === "draw") {
        if (!activeDraw.current) return;

        if (activeDraw.current.shape === "text") return;

        if (activeDraw.current.shape !== "freeHand") {
          activeDraw.current.endX = offsetX;
          activeDraw.current.endY = offsetY;

          if (
            activeDraw.current.shape === "rectangle" ||
            activeDraw.current.shape === "diamond" ||
            activeDraw.current.shape === "circle"
          ) {
            if (activeDraw.current.endX < activeDraw.current.startX!) {
              let a = activeDraw.current.endX;
              activeDraw.current.endX = activeDraw.current.startX;
              activeDraw.current.startX = a;
            }
            if (activeDraw.current.endY < activeDraw.current.startY!) {
              let a = activeDraw.current.endY;
              activeDraw.current.endY = activeDraw.current.startY;
              activeDraw.current.startY = a;
            }
          } else if (
            activeDraw.current.shape === "line" ||
            activeDraw.current.shape === "arrow"
          ) {
            activeDraw.current.points = [
              {
                x: (activeDraw.current.startX! + activeDraw.current.endX!) / 2,
                y: (activeDraw.current.startY! + activeDraw.current.endY!) / 2,
              },
            ];
          }
        }

        diagrams.current.push(activeDraw.current);

        const { undoRedoArray, undoRedoIndex } = pushToUndoRedoArray(
          {
            type: "create",
            originalDraw: null,
            modifiedDraw: JSON.parse(JSON.stringify(activeDraw.current)),
          },
          undoRedoArrayRef.current,
          undoRedoIndexRef.current
        );
        undoRedoArrayRef.current = undoRedoArray;
        undoRedoIndexRef.current = undoRedoIndex;
        updateUndoRedoState();
        activeDraw.current = null;
        startX.current = null;
        startY.current = null;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeActionRef.current === "select") {
        return;
      }

      if (activeActionRef.current === "draw") {
        if (!activeDraw.current || activeDraw.current.shape !== "text") return;

        event.preventDefault();

        if (event.key === "Enter") {
          diagrams.current.push(activeDraw.current!);
          const { undoRedoArray, undoRedoIndex } = pushToUndoRedoArray(
            {
              type: "create",
              originalDraw: null,
              modifiedDraw: JSON.parse(JSON.stringify(activeDraw.current!)),
            },
            undoRedoArrayRef.current,
            undoRedoIndexRef.current
          );
          undoRedoArrayRef.current = undoRedoArray;
          undoRedoIndexRef.current = undoRedoIndex;
          updateUndoRedoState();
          textInp.current = "";
          activeDraw.current = null;
        } else if (event.key === "Escape") {
          textInp.current = "";
          activeDraw.current = null;
        } else if (event.key === "Backspace") {
          textInp.current = textInp.current.slice(0, -1);
          activeDraw.current.text = textInp.current;
        } else if (event.key.length === 1) {
          textInp.current += event.key;
          activeDraw.current.text = textInp.current;
        }
      }

      if (activeActionRef.current === "draw") {
        if (activeDraw.current?.shape === "text") {
          shapeSelectionBox.current = handleShapeSelectionBox(
            activeDraw.current!,
            ctx
          );
          return;
        }
        shapeSelectionBox.current = null;
      }

      if (activeActionRef.current === "edit") {
        if (!selectedDraw.current || selectedDraw.current.shape !== "text")
          return;

        textInp.current = selectedDraw.current.text || "";

        event.preventDefault();

        if (event.key === "Enter") {
          diagrams.current.push(selectedDraw.current!);
          const { undoRedoArray, undoRedoIndex } = pushToUndoRedoArray(
            {
              type: "edit",
              originalDraw: originalDrawState.current,
              modifiedDraw: JSON.parse(JSON.stringify(selectedDraw.current!)),
            },
            undoRedoArrayRef.current,
            undoRedoIndexRef.current
          );
          undoRedoArrayRef.current = undoRedoArray;
          undoRedoIndexRef.current = undoRedoIndex;
          updateUndoRedoState();
          textInp.current = "";
          selectedDraw.current = null;
          setSelectedShape(null);
          shapeSelectionBox.current = null;
          setActiveAction("select");
        } else if (event.key === "Escape") {
          textInp.current = "";
          selectedDraw.current = null;
          setSelectedShape(null);
          setActiveAction("select");
        } else if (event.key === "Backspace") {
          textInp.current = textInp.current.slice(0, -1);
          selectedDraw.current.text = textInp.current;
        } else if (event.key.length === 1) {
          textInp.current += event.key;
          selectedDraw.current.text = textInp.current;
        }
      }

      if (activeActionRef.current === "edit") {
        if (selectedDraw.current?.shape === "text") {
          shapeSelectionBox.current = handleShapeSelectionBox(
            selectedDraw.current!,
            ctx
          );
          return;
        }
        shapeSelectionBox.current = null;
      }
    };

    const handleScroll = (event: WheelEvent) => {
      event.preventDefault();

      if (activeActionRef.current === "zoom" || event.ctrlKey) {
        const zoomSensitivity = 0.01;
        const newScale = scale.current - event.deltaY * zoomSensitivity;
        zoomToPoint(newScale);
      } else {
        panOffset.current.x -= event.deltaX;
        panOffset.current.y -= event.deltaY;
      }
    };

    canvasCurrent.addEventListener("mousedown", handleMouseDown);
    canvasCurrent.addEventListener("mouseup", handleMouseUp);
    canvasCurrent.addEventListener("mousemove", handleMouseMove);
    canvasCurrent.addEventListener("keydown", handleKeyDown);
    canvasCurrent.addEventListener("wheel", handleScroll);

    return () => {
      clearInterval(renderInterval);
      canvasCurrent.removeEventListener("mousedown", handleMouseDown);
      canvasCurrent.removeEventListener("mouseup", handleMouseUp);
      canvasCurrent.removeEventListener("mousemove", handleMouseMove);
      canvasCurrent.removeEventListener("keydown", handleKeyDown);
      canvasCurrent.removeEventListener("wheel", handleScroll);
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="h-screen w-screen relative">
        <div className="fixed z-2 w-fit h-fit bg-black rounded-lg left-1/2 top-3 transform -translate-x-1/2">
          <div className="bg-green-400/25 z-1 rounded-lg px-1.5 py-1 flex gap-1.5 items-center">
            <Button
              size="icon"
              className={`bg-transparent relative p-2 ${activeAction === "select" || activeAction === "move" || activeAction === "resize" ? "bg-green-600 hover:bg-green-600" : "hover:bg-green-600/20"} cursor-pointer`}
              onClick={() => {
                setActiveAction("select");
                if (activeDraw.current?.shape === "text") {
                  activeDraw.current = null;
                  shapeSelectionBox.current = null;
                }
              }}
            >
              {activeAction === "select" ||
              activeAction === "move" ||
              activeAction === "resize" ? (
                <PiCursorFill className="text-white" size="18" />
              ) : (
                <PiCursor className="text-white" size="18" />
              )}
              <p className="text-white font-mono absolute text-[8px] right-1 bottom-1">
                1
              </p>
            </Button>
            <Button
              size="icon"
              className={`bg-transparent relative p-2 ${activeAction === "draw" && activeShape === "rectangle" ? "bg-green-600 hover:bg-green-600" : "hover:bg-green-600/20"} cursor-pointer`}
              onClick={() => {
                setActiveAction("draw");
                setActiveShape("rectangle");
                if (activeDraw.current?.shape === "text") {
                  activeDraw.current = null;
                  shapeSelectionBox.current = null;
                }
              }}
            >
              {activeAction === "draw" && activeShape === "rectangle" ? (
                <PiSquareFill className="text-white" size="18" />
              ) : (
                <PiSquare className="text-white" size="18" />
              )}
              <p className="text-white font-mono absolute text-[8px] right-1 bottom-1">
                2
              </p>
            </Button>
            <Button
              size="icon"
              className={`bg-transparent relative p-2 ${activeAction === "draw" && activeShape === "diamond" ? "bg-green-600 hover:bg-green-600" : "hover:bg-green-600/20"} cursor-pointer`}
              onClick={() => {
                setActiveAction("draw");
                setActiveShape("diamond");
                if (activeDraw.current?.shape === "text") {
                  activeDraw.current = null;
                  shapeSelectionBox.current = null;
                }
              }}
            >
              {activeAction === "draw" && activeShape === "diamond" ? (
                <PiDiamondFill className="text-white" size="18" />
              ) : (
                <PiDiamond className="text-white" size="18" />
              )}
              <p className="text-white font-mono absolute text-[8px] right-1 bottom-1">
                3
              </p>
            </Button>
            <Button
              size="icon"
              className={`bg-transparent relative p-2 ${activeAction === "draw" && activeShape === "circle" ? "bg-green-600 hover:bg-green-600" : "hover:bg-green-600/20"} cursor-pointer`}
              onClick={() => {
                setActiveAction("draw");
                setActiveShape("circle");
                if (activeDraw.current?.shape === "text") {
                  activeDraw.current = null;
                  shapeSelectionBox.current = null;
                }
              }}
            >
              {activeAction === "draw" && activeShape === "circle" ? (
                <PiCircleFill className="text-white" size="18" />
              ) : (
                <PiCircle className="text-white" size="18" />
              )}
              <p className="text-white font-mono absolute text-[8px] right-1 bottom-1">
                4
              </p>
            </Button>
            <Button
              size="icon"
              className={`bg-transparent relative p-2 ${activeAction === "draw" && activeShape === "line" ? "bg-green-600 hover:bg-green-600" : "hover:bg-green-600/20"} cursor-pointer`}
              onClick={() => {
                setActiveAction("draw");
                setActiveShape("line");
                if (activeDraw.current?.shape === "text") {
                  activeDraw.current = null;
                  shapeSelectionBox.current = null;
                }
              }}
            >
              <PiLineVertical className="text-white rotate-90" size="18" />
              <p className="text-white font-mono absolute text-[8px] right-1 bottom-1">
                5
              </p>
            </Button>
            <Button
              size="icon"
              className={`bg-transparent relative p-2 ${activeAction === "draw" && activeShape === "arrow" ? "bg-green-600 hover:bg-green-600" : "hover:bg-green-600/20"} cursor-pointer`}
              onClick={() => {
                setActiveAction("draw");
                setActiveShape("arrow");
                if (activeDraw.current?.shape === "text") {
                  activeDraw.current = null;
                  shapeSelectionBox.current = null;
                }
              }}
            >
              <PiArrowRight className="text-white" size="18" />
              <p className="text-white font-mono absolute text-[8px] right-1 bottom-1">
                6
              </p>
            </Button>
            <Button
              size="icon"
              className={`bg-transparent relative p-2 ${activeAction === "draw" && activeShape === "freeHand" ? "bg-green-600 hover:bg-green-600" : "hover:bg-green-600/20"} cursor-pointer`}
              onClick={() => {
                setActiveAction("draw");
                setActiveShape("freeHand");
                if (activeDraw.current?.shape === "text") {
                  activeDraw.current = null;
                  shapeSelectionBox.current = null;
                }
              }}
            >
              {activeAction === "draw" && activeShape === "freeHand" ? (
                <PiPencilFill className="text-white" size="18" />
              ) : (
                <PiPencil className="text-white" size="18" />
              )}
              <p className="text-white font-mono absolute text-[8px] right-1 bottom-1">
                7
              </p>
            </Button>
            <Button
              size="icon"
              className={`bg-transparent relative p-2 ${(activeAction === "draw" && activeShape === "text") || activeAction === "edit" ? "bg-green-600 hover:bg-green-600" : "hover:bg-green-600/20"} cursor-pointer`}
              onClick={() => {
                setActiveAction("draw");
                setActiveShape("text");
                if (activeDraw.current?.shape === "text") {
                  activeDraw.current = null;
                  shapeSelectionBox.current = null;
                }
              }}
            >
              <BsFonts className="text-white" size="20" />
              <p className="text-white font-mono absolute text-[8px] right-1 bottom-1">
                8
              </p>
            </Button>
            <Button
              size="icon"
              className={`bg-transparent relative p-2 ${activeAction === "erase" ? "bg-green-600 hover:bg-green-600" : "hover:bg-green-600/20"} cursor-pointer`}
              onClick={() => {
                setActiveAction("erase");
                if (activeDraw.current?.shape === "text") {
                  activeDraw.current = null;
                  shapeSelectionBox.current = null;
                }
              }}
            >
              {activeAction === "erase" ? (
                <PiEraserFill className="text-white" size="18" />
              ) : (
                <PiEraser className="text-white" size="18" />
              )}
              <p className="text-white font-mono absolute text-[8px] right-1 bottom-1">
                9
              </p>
            </Button>
            <PiLineVerticalLight size="20" />
            <Button
              size="icon"
              className={`bg-transparent -ml-1 relative p-2 ${activeAction === "pan" ? "bg-green-600 hover:bg-green-600" : "hover:bg-green-600/20"} cursor-pointer`}
              onClick={() => {
                setActiveAction("pan");
                if (activeDraw.current?.shape === "text") {
                  activeDraw.current = null;
                  shapeSelectionBox.current = null;
                }
              }}
            >
              {activeAction === "pan" && isDragging ? (
                <LiaHandRock className="text-white" />
              ) : (
                <LiaHandPaper className="text-white" />
              )}
            </Button>
            <Button
              size="icon"
              className={`bg-transparent -ml-0.5 relative p-2 ${activeAction === "zoom" ? "bg-green-600 hover:bg-green-600" : "hover:bg-green-600/20"} cursor-pointer`}
              onClick={() => {
                setActiveAction("zoom");
                if (activeDraw.current?.shape === "text") {
                  activeDraw.current = null;
                  shapeSelectionBox.current = null;
                }
              }}
            >
              <TbZoom className="text-white" />
            </Button>
          </div>
        </div>

        {activeAction === "draw" ||
        activeAction === "edit" ||
        activeAction === "resize" ||
        (activeAction === "select" && selectedShape !== null) ||
        activeAction === "move" ? (
          activeShape === "text" ? (
            <div className="fixed px-3 py-2 z-2 w-fit h-fit bg-neutral-900 border border-neutral-600 rounded left-3 top-1/2 transform -translate-y-1/2 bg-black rounded-md">
              <div className="space-y-2 items-center rounded-md text-white">
                <div className="text-sm">
                  <h3>Color</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-[#eeeeee] hover:bg-[#eeeeee] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#eeeeee");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#FFD586] hover:bg-[#FFD586] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#FFD586");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#FF9898] hover:bg-[#FF9898] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#FF9898");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#B9D4AA] hover:bg-[#B9D4AA] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#B9D4AA");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#8DD8FF] hover:bg-[#8DD8FF] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#8DD8FF");
                      }}
                    >
                      ..
                    </Button>
                    <PiLineVerticalLight size="20" />
                    <Button
                      size="icon"
                      className="relative cursor-default -mr-1"
                      style={{ backgroundColor: activeStrokeStyle }}
                    ></Button>
                  </div>
                </div>
                <div className="text-sm">
                  <h3>Font</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className={`relative cursor-pointer text-white font-[Arial] -mr-1 ${activeFont === "Arial" ? "bg-green-600/40 hover:bg-green-600/40" : "bg-neutral-900 hover:bg-neutral-800"}`}
                      onClick={() => setActiveFont("Arial")}
                    >
                      Abc
                    </Button>
                    <Button
                      size="sm"
                      className={`relative cursor-pointer text-white font-[Verdana] -mr-1 ${activeFont === "Verdana" ? "bg-green-600/40 hover:bg-green-600/40" : "bg-neutral-900 hover:bg-neutral-800"}`}
                      onClick={() => setActiveFont("Verdana")}
                    >
                      Abc
                    </Button>
                    <Button
                      size="sm"
                      className={`relative cursor-pointer text-white font-[ComicSansMS] -mr-1 ${activeFont === "Comic Sans MS" ? "bg-green-600/40 hover:bg-green-600/40" : "bg-neutral-900 hover:bg-neutral-800"}`}
                      onClick={() => setActiveFont("Comic Sans MS")}
                    >
                      Abc
                    </Button>
                  </div>
                </div>
                <div className="text-sm">
                  <h3>Font Size</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className={`relative cursor-pointer text-white -mr-1 ${activeFontSize === "20" ? "bg-green-600/40 hover:bg-green-600/40" : "bg-neutral-900 hover:bg-neutral-800"}`}
                      onClick={() => setActiveFontSize("20")}
                    >
                      S
                    </Button>
                    <Button
                      size="sm"
                      className={`relative cursor-pointer text-white -mr-1 ${activeFontSize === "40" ? "bg-green-600/40 hover:bg-green-600/40" : "bg-neutral-900 hover:bg-neutral-800"}`}
                      onClick={() => setActiveFontSize("40")}
                    >
                      M
                    </Button>
                    <Button
                      size="sm"
                      className={`relative cursor-pointer text-white -mr-1 ${activeFontSize === "60" ? "bg-green-600/40 hover:bg-green-600/40" : "bg-neutral-900 hover:bg-neutral-800"}`}
                      onClick={() => setActiveFontSize("60")}
                    >
                      L
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeShape === "freeHand" ||
            activeShape === "arrow" ||
            activeShape === "line" ? (
            <div className="fixed px-3 py-2 z-2 w-fit h-fit bg-neutral-900 border border-neutral-600 rounded left-3 top-1/2 transform -translate-y-1/2 bg-black rounded-md">
              <div className="space-y-2 items-center rounded-md">
                <div className="text-sm">
                  <h3>Stroke</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-[#eeeeee] hover:bg-[#eeeeee] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#eeeeee");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#FFD586] hover:bg-[#FFD586] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#FFD586");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#FF9898] hover:bg-[#FF9898] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#FF9898");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#B9D4AA] hover:bg-[#B9D4AA] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#B9D4AA");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#8DD8FF] hover:bg-[#8DD8FF] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#8DD8FF");
                      }}
                    >
                      ..
                    </Button>
                    <PiLineVerticalLight size="20" />
                    <Button
                      size="icon"
                      className="relative cursor-default -mr-1"
                      style={{ backgroundColor: activeStrokeStyle }}
                    ></Button>
                  </div>
                </div>
                <div className="text-sm">
                  <h3>Stroke Width</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className={`relative cursor-pointer text-white -mr-1 ${activeLineWidth === 2 ? "bg-green-600/40 hover:bg-green-600/40" : "bg-neutral-900 hover:bg-neutral-800"}`}
                      onClick={() => {
                        setActiveLineWidth(2);
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        focusable="false"
                        role="img"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path
                          d="M4.167 10h11.666"
                          stroke="currentColor"
                          strokeWidth="1.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </Button>
                    <Button
                      size="sm"
                      className={`relative cursor-pointer text-white -mr-1 ${activeLineWidth === 3 ? "bg-green-600/40 hover:bg-green-600/40" : "bg-neutral-900 hover:bg-neutral-800"}`}
                      onClick={() => {
                        setActiveLineWidth(3);
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        focusable="false"
                        role="img"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path
                          d="M5 10h10"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </Button>
                    <Button
                      size="sm"
                      className={`relative cursor-pointer text-white -mr-1 ${activeLineWidth === 4 ? "bg-green-600/40 hover:bg-green-600/40" : "bg-neutral-900 hover:bg-neutral-800"}`}
                      onClick={() => {
                        setActiveLineWidth(4);
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        focusable="false"
                        role="img"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path
                          d="M5 10h10"
                          stroke="currentColor"
                          strokeWidth="3.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="fixed px-3 py-2 z-2 w-fit h-fit bg-neutral-900 border border-neutral-600 rounded left-3 top-1/2 transform -translate-y-1/2 bg-black rounded-md">
              <div className="space-y-2 items-center rounded-md">
                <div className="text-sm">
                  <h3>Stroke</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-[#eeeeee] hover:bg-[#eeeeee] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#eeeeee");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#FFD586] hover:bg-[#FFD586] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#FFD586");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#FF9898] hover:bg-[#FF9898] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#FF9898");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#B9D4AA] hover:bg-[#B9D4AA] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#B9D4AA");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#8DD8FF] hover:bg-[#8DD8FF] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveStrokeStyle("#8DD8FF");
                      }}
                    >
                      ..
                    </Button>
                    <PiLineVerticalLight size="20" />
                    <Button
                      size="icon"
                      className="relative cursor-default -mr-1"
                      style={{ backgroundColor: activeStrokeStyle }}
                    ></Button>
                  </div>
                </div>
                <div className="text-sm">
                  <h3>Background</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="relative cursor-pointer -mr-1 text-transparent hover:bg-transparent bg-transparent border border-gray-400/20"
                      onClick={() => {
                        setActiveFillStyle("#eeeeee00");
                      }}
                    >
                      .
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#FFD58660] hover:bg-[#FFD58660] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveFillStyle("#FFD58660");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#FF989860] hover:bg-[#FF989860] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveFillStyle("#FF989860");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#B9D4AA60] hover:bg-[#B9D4AA60] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveFillStyle("#B9D4AA60");
                      }}
                    >
                      ..
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#8DD8FF60] hover:bg-[#8DD8FF60] relative cursor-pointer -mr-1 text-transparent"
                      onClick={() => {
                        setActiveFillStyle("#8DD8FF60");
                      }}
                    >
                      ..
                    </Button>
                    <PiLineVerticalLight size="20" />
                    <Button
                      size="icon"
                      className="relative cursor-default -mr-1 border"
                      style={{ backgroundColor: activeFillStyle }}
                    ></Button>
                  </div>
                </div>
                <div className="text-sm">
                  <h3>Stroke Width</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className={`relative cursor-pointer text-white -mr-1 ${activeLineWidth === 3 ? "bg-green-600/40 hover:bg-green-600/40" : "bg-neutral-900 hover:bg-neutral-800"}`}
                      onClick={() => {
                        setActiveLineWidth(3);
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        focusable="false"
                        role="img"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path
                          d="M4.167 10h11.666"
                          stroke="currentColor"
                          strokeWidth="1.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </Button>
                    <Button
                      size="sm"
                      className={`relative cursor-pointer text-white -mr-1 ${activeLineWidth === 6 ? "bg-green-600/40 hover:bg-green-600/40" : "bg-neutral-900 hover:bg-neutral-800"}`}
                      onClick={() => {
                        setActiveLineWidth(6);
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        focusable="false"
                        role="img"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path
                          d="M5 10h10"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </Button>
                    <Button
                      size="sm"
                      className={`relative cursor-pointer text-white -mr-1 ${activeLineWidth === 9 ? "bg-green-600/40 hover:bg-green-600/40" : "bg-neutral-900 hover:bg-neutral-800"}`}
                      onClick={() => {
                        setActiveLineWidth(9);
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        focusable="false"
                        role="img"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path
                          d="M5 10h10"
                          stroke="currentColor"
                          strokeWidth="3.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <></>
        )}

        <div className="fixed flex gap-2 z-2 w-fit h-fit bg-neutral-900 rounded left-3 bottom-3 bg-black rounded-md">
          <div className="bg-black rounded-md">
            <div className="bg-green-400/25 p-1 flex items-center rounded-md">
              <Button
                size="icon"
                className="bg-transparent relative cursor-pointer -mr-1 hover:bg-green-600/40"
                onClick={() => zoomToPoint(scale.current - 0.1)}
              >
                <PiMinus className="text-white" size="18" />
              </Button>
              <PiLineVerticalLight size="20" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="bg-transparent relative cursor-pointer px-1 py-2 text-white font-mono text-sm h-auto hover:bg-green-600/40"
                    onClick={() => zoomToPoint(1)}
                  >
                    {(zoomLevel * 100).toFixed(0)}%
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset Zoom</p>
                </TooltipContent>
              </Tooltip>
              <PiLineVerticalLight size="20" />
              <Button
                size="icon"
                className="bg-transparent relative cursor-pointer -ml-1 hover:bg-green-600/40"
                onClick={() => zoomToPoint(scale.current + 0.1)}
              >
                <PiPlus className="text-white" size="18" />
              </Button>
            </div>
          </div>
          <div className="bg-black rounded-md">
            <div className="bg-green-400/25 p-1 flex gap-2 items-center rounded-md">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className="bg-transparent relative cursor-pointer border-r border-green-900 -mr-1 rounded-r-none bg-green-600/40 hover:bg-green-600/60"
                    onClick={executeUndo}
                    disabled={!canUndo}
                  >
                    <GrUndo className="text-white" size="18" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className="bg-transparent relative cursor-pointer border-l border-green-900 -ml-1 rounded-l-none bg-green-600/40 hover:bg-green-600/60"
                    onClick={executeRedo}
                    disabled={!canRedo}
                  >
                    <GrRedo className="text-white" size="18" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redo</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {isClient ? (
          <canvas
            tabIndex={0}
            ref={canvasRef}
            className="bg-neutral-900 absolute top-0 left-0 z-1"
            width={window.innerWidth}
            height={window.innerHeight}
          ></canvas>
        ) : (
          <canvas
            tabIndex={0}
            ref={canvasRef}
            className="bg-neutral-900"
          ></canvas>
        )}
      </div>
    </TooltipProvider>
  );
};

export default Canvas;
