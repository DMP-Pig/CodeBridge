package com.phonetopc.copycode.ui

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import com.phonetopc.copycode.R
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.BarcodeResult
import com.journeyapps.barcodescanner.DecoratedBarcodeView
import com.google.zxing.ResultPoint

/**
 * 扫码配对：扫描 PC 端二维码（包含 app/host/port/token 的 JSON）。
 * 识别成功后把原始文本带回 MainScreen 解析填充。
 */
class QrScanActivity : Activity() {

    private lateinit var barcodeView: DecoratedBarcodeView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_qr_scan)
        barcodeView = findViewById(R.id.scanner)
        barcodeView.decodeContinuous(object : BarcodeCallback {
            override fun barcodeResult(result: BarcodeResult?) {
                if (result != null && !result.text.isNullOrBlank()) {
                    val intent = Intent().putExtra(EXTRA_RESULT, result.text)
                    setResult(RESULT_OK, intent)
                    finish()
                }
            }

            override fun possibleResultPoints(resultPoints: List<ResultPoint>) {
                // 不需要花瓣取景框辅助点
            }
        })
    }

    override fun onResume() {
        super.onResume()
        try {
            barcodeView.resume()
        } catch (e: Exception) {
            Toast.makeText(this, R.string.qr_camera_error, Toast.LENGTH_LONG).show()
            finish()
        }
    }

    override fun onPause() {
        super.onPause()
        barcodeView.pause()
    }

    companion object {
        const val EXTRA_RESULT = "scan_result"
    }
}
