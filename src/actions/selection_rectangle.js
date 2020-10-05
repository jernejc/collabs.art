
import { getPixelForPointer } from '@actions/pixel';

export function clearRectangleSelection({ scene }) {

  if (scene.selectionRectangle) {
    scene.selectionRectangle.destroy();
    scene.selectionRectangle = null;
    scene.selectionRectangleBeginPixel = null;
    scene.selectionRectangleEndPixel = null;
  }
}

export function resizeSelectionRectangle({ pointer, scene }) {
  scene.selectionRectangleEndPixel = getPixelForPointer({ pointer, scene });

  const W = scene.selectionRectangleEndPixel.x - scene.selectionRectangleBeginPixel.x;
  const H = scene.selectionRectangleEndPixel.y - scene.selectionRectangleBeginPixel.y;

  // Bug when changing rect size: https://phaser.discourse.group/t/how-to-resize-gameobjects-rectangle-without-changing-scale/4777
  scene.selectionRectangle.geom.setSize(W, H);
  scene.selectionRectangle.setSize(W, H);
  scene.selectionRectangle.updateData();
}

export function createSelectionRectangle({ pointer, scene }) {
  scene.selectionRectangleBeginPixel = getPixelForPointer({ pointer, scene });

  const X = scene.selectionRectangleBeginPixel.x;
  const Y = scene.selectionRectangleBeginPixel.y;
  const W = pointer.x - scene.selectionRectangleBeginPixel.x;
  const H = pointer.y - scene.selectionRectangleBeginPixel.y;

  scene.selectionRectangle = scene.add.rectangle(X, Y, W, H);
  scene.selectionRectangle.setFillStyle(0xffffff, 0.15);
  scene.selectionRectangle.setStrokeStyle(1, 0xffffff, 0.9);
  scene.selectionRectangle.setDisplayOrigin(0, 0);
  scene.selectionRectangle.setDepth(100);
}