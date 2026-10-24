package com.menyushka;

import java.io.File;
import java.nio.charset.StandardCharsets;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MenyushkaApplication {

    public static void main(String[] args) {
        fixUnixDomainTmpDir();
        SpringApplication.run(MenyushkaApplication.class, args);
    }

    /**
     * На Windows JDK создаёт для селектора Tomcat unix-сокет во временной папке.
     * Если в пути есть не-ASCII символы (например, имя пользователя по-русски), соединение падает
     * с «Unable to establish loopback connection». Переключаем сокеты на ASCII-папку.
     */
    private static void fixUnixDomainTmpDir() {
        if (System.getProperty("jdk.net.unixdomain.tmpdir") != null) {
            return;
        }
        if (!System.getProperty("os.name", "").toLowerCase().contains("win")) {
            return;
        }
        // JDK берёт папку сокетов из профиля пользователя, а не только из java.io.tmpdir
        String[] sources = {
                System.getProperty("user.home", ""),
                System.getProperty("java.io.tmpdir", ""),
                String.valueOf(System.getenv("TEMP")),
                String.valueOf(System.getenv("TMP")),
                String.valueOf(System.getenv("USERPROFILE"))
        };
        boolean allAscii = true;
        for (String p : sources) {
            allAscii &= StandardCharsets.US_ASCII.newEncoder().canEncode(p);
        }
        if (allAscii) {
            return;
        }
        String[] candidates = {
                System.getenv("PUBLIC"),
                System.getenv("SystemRoot") == null ? null : System.getenv("SystemRoot") + File.separator + "Temp",
                "C:\\Temp"
        };
        for (String c : candidates) {
            if (c != null && StandardCharsets.US_ASCII.newEncoder().canEncode(c)) {
                File dir = new File(c);
                if (dir.isDirectory() && dir.canWrite()) {
                    System.setProperty("jdk.net.unixdomain.tmpdir", c);
                    return;
                }
            }
        }
    }
}
