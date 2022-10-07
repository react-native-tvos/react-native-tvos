/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.os.Bundle;
import android.os.Handler;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;
import com.facebook.react.views.view.ReactViewGroup;

/** Base Activity for React Native applications. */
public abstract class ReactActivity extends AppCompatActivity
    implements DefaultHardwareBackBtnHandler, PermissionAwareActivity {

  private final ReactActivityDelegate mDelegate;
  private boolean monitorFocus = true;

  protected ReactActivity() {
    mDelegate = createReactActivityDelegate();
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component. e.g. "MoviesApp"
   */
  protected @Nullable String getMainComponentName() {
    return null;
  }

  private Handler debugHandler;
  private static int focusMonitorInterval = 50;
  private FocusView focusView;

  /** Called at construction time, override if you have a custom delegate implementation. */
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegate(this, getMainComponentName());
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    mDelegate.onCreate(savedInstanceState);
    debugHandler = new Handler();
  }

  @Override
  protected void onPause() {
    super.onPause();
    mDelegate.onPause();
    stopFocusMonitor();
  }

  @Override
  protected void onResume() {
    super.onResume();
    mDelegate.onResume();
    if (monitorFocus)
      startFocusMonitor();
  }

  private void startFocusMonitor() {
    focusMonitor.run();
  }

  private void stopFocusMonitor() {
    debugHandler.removeCallbacks(focusMonitor);
  }

  private Runnable focusMonitor = new Runnable() {
    private View previousFocus;

    @Override
    public void run() {
      try {
        highlightFocus();
      } finally {
        debugHandler.postDelayed(focusMonitor, focusMonitorInterval);
      }
    }

    private void highlightFocus() {
      if (focusView == null) {
        focusView = new FocusView(ReactActivity.this);
        addContentView(focusView, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
      }
      View focused = getCurrentFocus();
      if (focused == null) {
        focusView.rect.setEmpty();
        focusView.invalidate();
        return;
      }
      if (this.previousFocus != focused) {
        this.previousFocus = focused;
        focusView.message = focused.toString();
        focusView.alpha = 30;
      }
      focused.getGlobalVisibleRect(focusView.getRect());
      focusView.invalidate();
      if (focusView.alpha > 0) {
        focusView.alpha--;
      }
    }
  };

  @Override
  protected void onDestroy() {
    super.onDestroy();
    mDelegate.onDestroy();
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    mDelegate.onActivityResult(requestCode, resultCode, data);
  }

  @Override
  public boolean onKeyDown(int keyCode, KeyEvent event) {
    return mDelegate.onKeyDown(keyCode, event) || super.onKeyDown(keyCode, event);
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    return mDelegate.onKeyUp(keyCode, event) || super.onKeyUp(keyCode, event);
  }

  @Override
  public boolean onKeyLongPress(int keyCode, KeyEvent event) {
    return mDelegate.onKeyLongPress(keyCode, event) || super.onKeyLongPress(keyCode, event);
  }

  @Override
  public void onBackPressed() {
    if (!mDelegate.onBackPressed()) {
      super.onBackPressed();
    }
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    super.onBackPressed();
  }

  @Override
  public void onNewIntent(Intent intent) {
    if (!mDelegate.onNewIntent(intent)) {
      super.onNewIntent(intent);
    }
  }

  @Override
  public void requestPermissions(
      String[] permissions, int requestCode, PermissionListener listener) {
    mDelegate.requestPermissions(permissions, requestCode, listener);
  }

  @Override
  public void onRequestPermissionsResult(
      int requestCode, String[] permissions, int[] grantResults) {
    mDelegate.onRequestPermissionsResult(requestCode, permissions, grantResults);
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    mDelegate.onWindowFocusChanged(hasFocus);
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    mDelegate.onConfigurationChanged(newConfig);
  }

  protected final ReactNativeHost getReactNativeHost() {
    return mDelegate.getReactNativeHost();
  }

  protected final ReactInstanceManager getReactInstanceManager() {
    return mDelegate.getReactInstanceManager();
  }


  protected final void loadApp(String appKey) {
    mDelegate.loadApp(appKey);
  }

  private static class FocusView extends View {
    public int alpha;
    public String message = "";
    Paint paintFill = new Paint();
    Paint paintBorder = new Paint();
    Paint paintOutOfScreen = new Paint();
    private Paint paintText = new Paint();
    Rect rect = new Rect(0,0,0,0);

    public FocusView(Context context) {
      super(context);
      paintFill.setStyle(Paint.Style.FILL);
      paintFill.setColor(Color.GREEN);
      paintBorder.setStyle(Paint.Style.STROKE);
      paintBorder.setColor(Color.RED);
      paintBorder.setStrokeWidth(1);
      paintOutOfScreen.setStyle(Paint.Style.FILL);
      paintOutOfScreen.setColor(Color.MAGENTA);
      paintText.setColor(Color.WHITE);
      paintText.setStyle(Paint.Style.FILL);
      paintText.setTextSize(20);
      paintText.setTextAlign(Paint.Align.RIGHT);
    }

    public void onDraw(Canvas canvas) {
      super.onDraw(canvas);
      paintFill.setAlpha(alpha);
      canvas.drawRect(rect.left, rect.top, rect.right, rect.bottom, paintFill);
      canvas.drawRect(rect.left, rect.top, rect.right, rect.bottom, paintBorder);
      int w = getWidth();
      int h = getHeight();
      if (rect.left > w) {
        canvas.drawRect(w - 10, 0, w, h, paintOutOfScreen);
      }
      if (rect.right < 0) {
        canvas.drawRect(0, 0, 10, h, paintOutOfScreen);
      }
      if (rect.top > h) {
        canvas.drawRect(0, h - 10, w, h, paintOutOfScreen);
      }
      if (rect.bottom < 0) {
        canvas.drawRect(0, 0, w, 10, paintOutOfScreen);
      }
      canvas.drawText(message, w - 10, 30, paintText);
    }

    public Rect getRect() {
      return rect;
    }
  }
}
