/* نافذة الربط التفاعلية — منطق القشرة (مخدوم ملفاً ثابتاً احتراماً لـ CSP script-src 'self')
   يغطي تأخر انتشار KV الإنتاجية باستطلاع صبور، ثم يُدخل نافذة الدخول التفاعلية بإطار عقدة الترحيل. */
(function () {
  "use strict";
  var st = document.getElementById("st");
  var tok = location.pathname.split("/").pop().replace(/\/+$/, "");
  var tries = 0;
  var loaded = false;

  function show(id) {
    document.getElementById(id).hidden = false;
    document.getElementById("wait").hidden = true;
  }

  function fetchInfo() {
    fetch("/api/studio/link-info?token=" + encodeURIComponent(tok), { credentials: "same-origin" }).then(function (r) {
      if (r.status === 404) {
        /* صبر يغطي تأخر انتشار KV (حتى ~30ث) قبل إعلان الانتهاء */
        if (++tries < 12) { setTimeout(fetchInfo, 2500); return; }
        st.textContent = "انتهت صلاحية رابط الربط";
        show("expired");
        return;
      }
      if (r.status === 503) { st.textContent = "خدمة الربط السحابية تُجهَّز الآن — عد بعد دقائق وأعد المحاولة."; return; }
      if (!r.ok) { st.textContent = "سجّل الدخول إلى المنصة أولاً ثم أعد المحاولة."; return; }
      r.json().then(function (d) {
        document.getElementById("fb-a").href = d.relay;
        var fr = document.getElementById("ri");
        fr.onload = function () { loaded = true; fr.classList.add("on"); document.getElementById("wait").hidden = true; document.getElementById("slow").hidden = true; st.textContent = "نافذة الدخول التفاعلية حية — سجّل دخولك بنفسك داخلها"; };
        fr.src = d.relay + "?embed=1";
        setTimeout(function () {
          if (!loaded) { show("slow"); st.textContent = "تشغيل متصفح الربط يستغرق لحظات — النافذة تُفتح تلقائياً عند جهوزها، أو افتحها مباشرة:"; }
        }, 45000);
      }).catch(function () { st.textContent = "تعذر الاتصال — أعد المحاولة."; });
    }).catch(function () { st.textContent = "تعذر الاتصال — أعد المحاولة."; });
  }

  fetchInfo();
})();
