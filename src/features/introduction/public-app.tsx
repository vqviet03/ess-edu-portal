"use client";
import { useRef, useState } from "react";
import { Provider } from "react-redux";
import { IntroductionView } from "./view";
import { introductionApi, introductionStore } from "./public-api";
import type { IntroductionContent, Registration } from "./models";
function PublicContent({
  content,
  assetsBase = "",
}: {
  content: IntroductionContent;
  assetsBase?: string;
}) {
  const [send, state] = introductionApi.useRegisterIntroductionMutation(),
    key = useRef(""),
    pending = useRef(false);
  const [error, setError] = useState("");
  async function register(data: Omit<Registration, "requestKey">) {
    if (pending.current || state.isSuccess) return;
    pending.current = true;
    if (!key.current) key.current = crypto.randomUUID();
    setError("");
    try {
      await send({ ...data, requestKey: key.current }).unwrap();
    } catch (e) {
      const value = e as { data?: { error?: { message?: string } } };
      setError(
        value.data?.error?.message ??
          "Không gửi được đăng ký. Vui lòng thử lại.",
      );
    } finally {
      pending.current = false;
    }
  }
  return (
    <IntroductionView
      content={content}
      assetsBase={assetsBase}
      onRegister={(data) => void register(data)}
      registrationState={
        state.isSuccess ? "success" : state.isLoading ? "saving" : "idle"
      }
      registrationError={error}
    />
  );
}
export function PublicIntroductionApp({
  content,
  assetsBase,
}: {
  content: IntroductionContent;
  assetsBase?: string;
}) {
  const [store] = useState(introductionStore);
  return (
    <Provider store={store}>
      <PublicContent content={content} assetsBase={assetsBase} />
    </Provider>
  );
}
