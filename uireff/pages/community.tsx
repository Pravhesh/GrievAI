import React, { useEffect } from 'react';
import { animate } from 'animejs';
import IpfsUpload from '../src/components/IpfsUpload';

const CommunityPage = () => {
  useEffect(() => {
    animate('.forum-header', {
      translateY: [-50, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: 'easeOutExpo',
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white shadow forum-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-8 leading-tight">
            Community Forum
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Engage with other members, share ideas, and collaborate on projects.
          </p>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <IpfsUpload />
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
              {/* Forum content will go here */}
              <p className="text-center text-gray-500 mt-20">
                Welcome to the GrievAI Community Forum!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommunityPage;
