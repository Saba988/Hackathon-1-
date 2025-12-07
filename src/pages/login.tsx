import React from 'react';
import Layout from '@theme/Layout';
import AuthForm from '@site/src/components/Auth/AuthForm';

function Login() {
  const handleAuthSuccess = () => {
    window.location.href = '/';
  };

  return (
    <Layout title="Sign In" description="Sign in to the website">
      <main>
        <AuthForm type="login" onAuthSuccess={handleAuthSuccess} />
      </main>
    </Layout>
  );
}

export default Login;
