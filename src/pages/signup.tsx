import React from 'react';
import Layout from '@theme/Layout';
import AuthForm from '@site/src/components/Auth/AuthForm';

function Signup() {
  const handleAuthSuccess = () => {
    window.location.href = '/';
  };

  return (
    <Layout title="Sign Up" description="Sign up to the website">
      <main>
        <AuthForm type="signup" onAuthSuccess={handleAuthSuccess} />
      </main>
    </Layout>
  );
}

export default Signup;
