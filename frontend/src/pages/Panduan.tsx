import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  GraduationCap,
  HelpCircle,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Tab = "mahasiswa" | "admin";

export function Panduan() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("mahasiswa");

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="text-indigo-600" size={20} />
          <h1 className="text-xl sm:text-2xl font-semibold">{t("panduan.title")}</h1>
        </div>
        <p className="text-sm text-slate-600">{t("panduan.subtitle")}</p>

        <div className="mt-4 flex gap-1 bg-slate-100 rounded-md p-1 w-full sm:w-fit">
          <TabButton active={tab === "mahasiswa"} onClick={() => setTab("mahasiswa")}>
            <GraduationCap size={14} />
            {t("panduan.tab_mahasiswa")}
          </TabButton>
          <TabButton active={tab === "admin"} onClick={() => setTab("admin")}>
            <ShieldCheck size={14} />
            {t("panduan.tab_admin")}
          </TabButton>
        </div>
      </div>

      {tab === "mahasiswa" ? <MahasiswaGuide /> : <AdminGuide />}

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Mail size={16} className="text-slate-500" />
          <h2 className="font-semibold">{t("panduan.contact_title")}</h2>
        </div>
        <p className="text-sm text-slate-600">{t("panduan.contact_body")}</p>
      </div>

      <div className="text-center">
        <Link
          to={tab === "mahasiswa" ? "/" : "/admin"}
          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <Sparkles size={14} />
          {tab === "mahasiswa" ? t("mahasiswa_login.cta_login") : t("admin_login.cta_login")}
        </Link>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors " +
        (active ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900")
      }
    >
      {children}
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <h2 className="font-semibold text-base sm:text-lg mb-2">{title}</h2>
      <div className="text-sm text-slate-700 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function MahasiswaGuide() {
  const { t } = useTranslation();
  const kdItems = [
    "mhs_step3_kd1",
    "mhs_step3_kd2",
    "mhs_step3_kd3",
    "mhs_step3_kd4",
    "mhs_step3_kd5",
    "mhs_step3_kd6",
    "mhs_step3_kd7",
  ] as const;
  const scaleItems = [
    "mhs_step3_scale_1",
    "mhs_step3_scale_2",
    "mhs_step3_scale_3",
    "mhs_step3_scale_4",
  ] as const;
  const ethicsItems = ["mhs_ethics_1", "mhs_ethics_2", "mhs_ethics_3", "mhs_ethics_4"] as const;
  const faqItems = [
    { q: "mhs_faq_q1", a: "mhs_faq_a1" },
    { q: "mhs_faq_q2", a: "mhs_faq_a2" },
    { q: "mhs_faq_q3", a: "mhs_faq_a3" },
    { q: "mhs_faq_q4", a: "mhs_faq_a4" },
  ] as const;

  return (
    <div className="space-y-3">
      <Section title={t("panduan.mhs_intro_title")}>
        <p>{t("panduan.mhs_intro_body")}</p>
      </Section>

      <Section title={t("panduan.mhs_step1_title")}>
        <p>{t("panduan.mhs_step1_body")}</p>
      </Section>

      <Section title={t("panduan.mhs_step2_title")}>
        <p>{t("panduan.mhs_step2_body")}</p>
      </Section>

      <Section title={t("panduan.mhs_step3_title")}>
        <p>{t("panduan.mhs_step3_body")}</p>
        <div className="mt-2 rounded-md bg-slate-50 border border-slate-200 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-1.5">
            {t("panduan.mhs_step3_scale_title")}
          </p>
          <ul className="list-disc pl-4 space-y-1 text-sm">
            {scaleItems.map((k) => (
              <li key={k}>{t(`panduan.${k}` as const)}</li>
            ))}
          </ul>
        </div>
        <div className="mt-2 rounded-md bg-slate-50 border border-slate-200 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-1.5">
            {t("panduan.mhs_step3_kd_title")}
          </p>
          <ul className="list-disc pl-4 space-y-1 text-sm">
            {kdItems.map((k) => (
              <li key={k}>{t(`panduan.${k}` as const)}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title={t("panduan.mhs_step4_title")}>
        <p>{t("panduan.mhs_step4_body")}</p>
      </Section>

      <Section title={t("panduan.mhs_step5_title")}>
        <p>{t("panduan.mhs_step5_body")}</p>
      </Section>

      <Section title={t("panduan.mhs_ethics_title")}>
        <ul className="list-disc pl-4 space-y-1">
          {ethicsItems.map((k) => (
            <li key={k}>{t(`panduan.${k}` as const)}</li>
          ))}
        </ul>
      </Section>

      <Section title={t("panduan.mhs_faq_title")}>
        <div className="space-y-3">
          {faqItems.map(({ q, a }) => (
            <div key={q}>
              <p className="font-medium text-slate-800 flex items-start gap-1.5">
                <HelpCircle size={14} className="mt-0.5 shrink-0 text-indigo-500" />
                {t(`panduan.${q}` as const)}
              </p>
              <p className="text-sm text-slate-600 pl-5">{t(`panduan.${a}` as const)}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function AdminGuide() {
  const { t } = useTranslation();
  const stepTabs = [
    "admin_step4_t1",
    "admin_step4_t2",
    "admin_step4_t3",
  ] as const;
  const securityItems = [
    "admin_security_1",
    "admin_security_2",
    "admin_security_3",
    "admin_security_4",
  ] as const;

  return (
    <div className="space-y-3">
      <Section title={t("panduan.admin_intro_title")}>
        <p>{t("panduan.admin_intro_body")}</p>
      </Section>

      <Section title={t("panduan.admin_step1_title")}>
        <p>{t("panduan.admin_step1_body")}</p>
      </Section>

      <Section title={t("panduan.admin_step2_title")}>
        <p>{t("panduan.admin_step2_body")}</p>
      </Section>

      <Section title={t("panduan.admin_step3_title")}>
        <p>{t("panduan.admin_step3_body")}</p>
      </Section>

      <Section title={t("panduan.admin_step4_title")}>
        <p>{t("panduan.admin_step4_body")}</p>
        <ul className="list-disc pl-4 space-y-1 mt-2">
          {stepTabs.map((k) => (
            <li key={k}>{t(`panduan.${k}` as const)}</li>
          ))}
        </ul>
      </Section>

      <Section title={t("panduan.admin_step5_title")}>
        <p>{t("panduan.admin_step5_body")}</p>
      </Section>

      <Section title={t("panduan.admin_step6_title")}>
        <p>{t("panduan.admin_step6_body")}</p>
      </Section>

      <Section title={t("panduan.admin_security_title")}>
        <ul className="list-disc pl-4 space-y-1">
          {securityItems.map((k) => (
            <li key={k}>{t(`panduan.${k}` as const)}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
