import { Facebook, Globe } from "lucide-react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import FacebookLogin from "@greatsumini/react-facebook-login";
import { authApi } from "../api/api";

const GOOGLE_CLIENT_ID =
  "799480818354-nctj8a3jjuc43g7e6k9ipa11bh9rqb99.apps.googleusercontent.com";

interface AuthSocialLoginsProps {
  loading: boolean;
  setLoading: (value: boolean) => void;
  setError: (message: string) => void;
  onAuthSuccess: (data: unknown, defaultName?: string) => void;
}

function AuthSocialLoginsInner({
  loading,
  setLoading,
  setError,
  onAuthSuccess,
}: AuthSocialLoginsProps) {
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setError("");
        setLoading(true);

        const data = await authApi.googleLogin({
          token: tokenResponse.access_token,
        });

        onAuthSuccess(data);
      } catch (err: unknown) {
        console.error("Google login error:", err);
        setError("Đăng nhập Google thất bại.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Lỗi kết nối Google."),
  });

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => loginWithGoogle()}
        type="button"
        disabled={loading}
        className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-[#EADBC8] hover:bg-[#F4EBE1] text-[#5C4033] rounded-xl text-[11px] font-semibold transition-colors shadow-sm disabled:opacity-60"
      >
        <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
        Google
      </button>

      <FacebookLogin
        appId="1394088452607338"
        scope="public_profile"
        onSuccess={async (res) => {
          try {
            setError("");
            setLoading(true);

            if (!res.accessToken) {
              setError("Không lấy được Facebook access token.");
              return;
            }

            const data = await authApi.facebookLogin({
              token: res.accessToken,
            });

            onAuthSuccess(data, "Facebook User");
          } catch (err: unknown) {
            console.error("Facebook login error:", err);
            setError("Đăng nhập Facebook thất bại.");
          } finally {
            setLoading(false);
          }
        }}
        onFail={(err) => {
          console.error("Facebook SDK error:", err);
          setError("Lỗi kết nối Facebook.");
        }}
        render={({ onClick }) => (
          <button
            onClick={onClick}
            type="button"
            disabled={loading}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-[11px] font-semibold transition-colors shadow-sm disabled:opacity-60"
          >
            <Facebook className="w-3.5 h-3.5" />
            Facebook
          </button>
        )}
      />
    </div>
  );
}

export default function AuthSocialLogins(props: AuthSocialLoginsProps) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthSocialLoginsInner {...props} />
    </GoogleOAuthProvider>
  );
}
