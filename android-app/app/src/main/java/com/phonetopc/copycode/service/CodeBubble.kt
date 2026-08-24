package com.phonetopc.copycode.service

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import com.phonetopc.copycode.data.Settings as AppSettings

/**
 * Floating bubble: show the verification code on top of the screen with a
 * glassmorphism style. Tap to copy, auto-dismiss after a configurable delay.
 * Requires SYSTEM_ALERT_WINDOW permission.
 */
object CodeBubble {

    private const val DEFAULT_SECONDS = 15
    private const val MAX_SECONDS = 120
    private val mainHandler = Handler(Looper.getMainLooper())

    @Volatile private var overlayView: View? = null
    @Volatile private var windowManager: WindowManager? = null
    @Volatile private var bubbleSeconds = DEFAULT_SECONDS

    private var codeTextView: TextView? = null
    private var metaTextView: TextView? = null
    private var hintTextView: TextView? = null

    private val dismissRunnable = Runnable { dismiss() }

    fun canDrawOverlays(context: Context): Boolean =
        Settings.canDrawOverlays(context.applicationContext)

    fun show(context: Context, code: String, app: String) {
        val appCtx = context.applicationContext
        val s = try {
            AppSettings.get()
        } catch (_: IllegalStateException) {
            AppSettings.init(appCtx)
        }
        if (!s.floatBubble) return
        if (!canDrawOverlays(appCtx)) return
        bubbleSeconds = (if (s.bubbleSeconds > 0) s.bubbleSeconds else DEFAULT_SECONDS).coerceIn(5, MAX_SECONDS)
        mainHandler.post {
            try {
                showOnMain(appCtx, code, app)
            } catch (_: Exception) {
                // ignore: overlay may not be available (permission revoked, etc.)
            }
        }
    }

    private fun showOnMain(context: Context, code: String, app: String) {
        val wm = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager ?: return
        windowManager = wm
        if (overlayView == null) {
            val view = buildView(context)
            try {
                wm.addView(view, createLayoutParams(context))
                overlayView = view
            } catch (_: Exception) {
                overlayView = null
                return
            }
        }
        codeTextView?.text = code
        metaTextView?.text = if (app.isBlank()) "" else "\u6765\u81ea " + app
        metaTextView?.visibility = if (app.isBlank()) View.GONE else View.VISIBLE
        hintTextView?.text = "\u70b9\u51fb\u590d\u5236" + " \u00b7 " + bubbleSeconds + "s \u540e\u81ea\u52a8\u6d88\u5931"
        mainHandler.removeCallbacks(dismissRunnable)
        mainHandler.postDelayed(dismissRunnable, bubbleSeconds * 1000L)
    }

    private fun buildView(context: Context): View {
        val density = context.resources.displayMetrics.density
        fun dp(v: Int) = (v * density).toInt()

        val root = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(12), dp(16), dp(12))
            isClickable = true
            isFocusable = true
        }
        root.background = GradientDrawable().apply {
            cornerRadius = dp(22).toFloat()
            setColor(0xF20B1220.toInt())
            setStroke(dp(1), 0x556EA8FF)
        }
        root.elevation = dp(18).toFloat()

        val top = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        val dot = View(context).apply {
            background = GradientDrawable().apply {
                cornerRadius = dp(5).toFloat()
                setColor(0xFF6EA8FF.toInt())
            }
        }
        val title = TextView(context).apply {
            text = "\u9a8c\u8bc1\u7801"
            setTextColor(Color.WHITE)
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
        }
        top.addView(dot, LinearLayout.LayoutParams(dp(10), dp(10)).apply { rightMargin = dp(7) })
        top.addView(title, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT))

        val codeTv = TextView(context).apply {
            textSize = 26f
            setTextColor(Color.WHITE)
            typeface = Typeface.MONOSPACE
            letterSpacing = 0.08f
            includeFontPadding = false
        }
        codeTextView = codeTv

        val metaTv = TextView(context).apply {
            textSize = 12f
            setTextColor(0xFF6EA8FF.toInt())
        }
        metaTextView = metaTv

        val hintTv = TextView(context).apply {
            textSize = 10.5f
            setTextColor(0x99FFFFFF.toInt())
            alpha = 0.9f
        }
        hintTextView = hintTv

        root.addView(top, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT))
        root.addView(codeTv, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(6) })
        root.addView(metaTv, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(3) })
        root.addView(hintTv, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(8) })

        root.setOnClickListener {
            copyToClipboard(context.applicationContext, codeTextView?.text?.toString() ?: "")
            dismiss()
        }
        root.setOnLongClickListener {
            dismiss()
            true
        }
        return root
    }

    private fun createLayoutParams(context: Context): WindowManager.LayoutParams {
        val lp = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT,
        )
        lp.gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
        lp.y = statusBarHeight(context) + dpPx(context, 16)
        return lp
    }

    private fun dpPx(context: Context, v: Int): Int =
        (v * context.resources.displayMetrics.density).toInt()

    private fun statusBarHeight(context: Context): Int {
        val res = context.resources
        val id = res.getIdentifier("status_bar_height", "dimen", "android")
        return if (id > 0) res.getDimensionPixelSize(id) else 0
    }

    private fun copyToClipboard(context: Context, text: String) {
        if (text.isBlank()) return
        try {
            val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            cm.setPrimaryClip(ClipData.newPlainText("code", text))
            Toast.makeText(context, "\u5df2\u590d\u5236", Toast.LENGTH_SHORT).show()
        } catch (_: Exception) {
            // ignore
        }
    }

    fun dismiss() {
        mainHandler.removeCallbacks(dismissRunnable)
        val view = overlayView ?: return
        overlayView = null
        try {
            windowManager?.removeView(view)
        } catch (_: Exception) {
            // view may have been removed by the system already
        }
        windowManager = null
    }
}
