import React from "react";
import type { User } from "../types";

interface LoginViewProps {
  onLogin?: (user: User) => void;
}

const LOGIN_URL = import.meta.env.VITE_BUYMESHO_LOGIN_URL ?? "https://buymesho.vercel.app/login";
const SIGNUP_URL = import.meta.env.VITE_BUYMESHO_SIGNUP_URL ?? "https://buymesho.vercel.app/signup";

export function LoginView(_props: LoginViewProps) {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
        <div className="space-y-2 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            BuyMesho Identity Required
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Ticket Validator</h1>
          <p className="text-sm text-slate-600">
            Only BuyMesho creators and approved gate staff can continue.
          </p>
        </div>

        <div className="space-y-3">
          <a
            href={LOGIN_URL}
            className="flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Sign in with BuyMesho
          </a>
          <a
            href={SIGNUP_URL}
            className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            Create a BuyMesho account
          </a>
        </div>
      </div>
    </div>
  );
}
