package com.phonetopc.copycode.data

import android.content.Context
import com.phonetopc.copycode.R
import java.security.KeyStore
import java.security.SecureRandom
import java.security.cert.CertificateFactory
import javax.net.ssl.HostnameVerifier
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSession
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

/**
 * 与 PC 端之间的 HTTPS 加密传输（TLS）。
 * 手机端内置与 PC 端相同的自签证书（res/raw/codebridge_cert.pem），
 * 客户端只信任该证书（证书固定），局域网 IP 直连时不再校验主机名。
 */
object Tls {

    @Volatile
    private var appContext: Context? = null

    @Volatile
    private var cachedContext: SSLContext? = null

    /** 缓存 ApplicationContext：服务/广播可能先于主界面启动 */
    fun init(context: Context) {
        if (appContext == null) {
            synchronized(this) {
                if (appContext == null) appContext = context.applicationContext
            }
        }
    }

    private fun ctx(): Context = appContext ?: error("Tls.init() 尚未调用")

    /** 只信任内置 CodeBridge 证书的 SSLContext（懒加载并缓存） */
    fun sslContext(): SSLContext {
        cachedContext?.let { return it }
        synchronized(this) {
            cachedContext?.let { return it }
            val cert = ctx().resources.openRawResource(R.raw.codebridge_cert).use { stream ->
                CertificateFactory.getInstance("X.509").generateCertificate(stream)
            }
            val ks = KeyStore.getInstance(KeyStore.getDefaultType()).apply { load(null, null) }
            ks.setCertificateEntry("codebridge", cert)
            val tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
            tmf.init(ks)
            val x509 = tmf.trustManagers.filterIsInstance<X509TrustManager>().firstOrNull()
                ?: error("no X509TrustManager")
            val ssl = SSLContext.getInstance("TLS")
            ssl.init(null, arrayOf(x509), SecureRandom())
            cachedContext = ssl
            return ssl
        }
    }

    /** 局域网 IP 直连：主机名不参与校验（身份已由证书固定保证） */
    val hostnameVerifier: HostnameVerifier = HostnameVerifier { _: String?, _: SSLSession? -> true }
}
