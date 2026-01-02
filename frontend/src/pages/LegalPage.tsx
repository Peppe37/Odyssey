import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, ArrowLeft } from 'lucide-react';

type TabType = 'terms' | 'privacy';

const LegalPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('terms');

    return (
        <div className="min-h-screen bg-slate-900 px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/register"
                        className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Register
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Legal Information</h1>
                    <p className="text-slate-400 mt-2">
                        Please read our Terms of Service and Privacy Policy carefully before using Odyssey.
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-700 mb-6">
                    <button
                        onClick={() => setActiveTab('terms')}
                        className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'terms'
                                ? 'text-purple-400 border-b-2 border-purple-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Terms of Service
                    </button>
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'privacy'
                                ? 'text-purple-400 border-b-2 border-purple-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Shield className="h-4 w-4 mr-2" />
                        Privacy Policy
                    </button>
                </div>

                {/* Content */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-2xl">
                    {activeTab === 'terms' ? <TermsContent /> : <PrivacyContent />}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-slate-500">
                    Last updated: January 2026
                </div>
            </div>
        </div>
    );
};

const TermsContent: React.FC = () => (
    <div className="prose prose-invert max-w-none">
        <h2 className="text-2xl font-bold text-white mb-6">Terms of Service</h2>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">1. Acceptance of Terms</h3>
            <p className="text-slate-300 leading-relaxed">
                By accessing and using Odyssey ("the Service"), you accept and agree to be bound by the terms
                and provision of this agreement. If you do not agree to abide by these terms, please do not
                use this Service.
            </p>
        </section>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">2. Description of Service</h3>
            <p className="text-slate-300 leading-relaxed">
                Odyssey is a collaborative mapping platform that allows users to create, share, and explore
                travel maps. The Service enables users to mark locations, create routes, and collaborate with
                other users on shared maps.
            </p>
        </section>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">3. User Accounts</h3>
            <p className="text-slate-300 leading-relaxed">
                To use certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mt-3">
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
        </section>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">4. User Content</h3>
            <p className="text-slate-300 leading-relaxed">
                You retain ownership of any content you submit, post, or display on the Service. By submitting
                content, you grant Odyssey a worldwide, non-exclusive, royalty-free license to use, reproduce,
                modify, and display such content in connection with the Service.
            </p>
        </section>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">5. Prohibited Conduct</h3>
            <p className="text-slate-300 leading-relaxed">You agree not to:</p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mt-3">
                <li>Use the Service for any unlawful purpose</li>
                <li>Upload malicious code or attempt to compromise the Service</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Impersonate any person or entity</li>
                <li>Interfere with or disrupt the Service or servers</li>
            </ul>
        </section>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">6. Termination</h3>
            <p className="text-slate-300 leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without prior
                notice, for conduct that we believe violates these Terms or is harmful to other users, us, or
                third parties, or for any other reason at our sole discretion.
            </p>
        </section>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">7. Disclaimer of Warranties</h3>
            <p className="text-slate-300 leading-relaxed">
                The Service is provided "as is" and "as available" without warranties of any kind, either
                express or implied, including but not limited to implied warranties of merchantability,
                fitness for a particular purpose, or non-infringement.
            </p>
        </section>

        <section>
            <h3 className="text-lg font-semibold text-purple-400 mb-3">8. Contact</h3>
            <p className="text-slate-300 leading-relaxed">
                For any questions regarding these Terms of Service, please contact us at{' '}
                <a href="mailto:support@odyssey.app" className="text-purple-400 hover:text-purple-300">
                    support@odyssey.app
                </a>
            </p>
        </section>
    </div>
);

const PrivacyContent: React.FC = () => (
    <div className="prose prose-invert max-w-none">
        <h2 className="text-2xl font-bold text-white mb-6">Privacy Policy</h2>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">1. Information We Collect</h3>
            <p className="text-slate-300 leading-relaxed mb-3">
                We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li><strong>Account Information:</strong> Email address, username, and password when you register</li>
                <li><strong>Profile Information:</strong> Any additional information you add to your profile</li>
                <li><strong>Location Data:</strong> Geographic coordinates of points you add to maps</li>
                <li><strong>Usage Data:</strong> Information about how you use the Service</li>
            </ul>
        </section>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">2. How We Use Your Information</h3>
            <p className="text-slate-300 leading-relaxed mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>Provide, maintain, and improve the Service</li>
                <li>Create and manage your account</li>
                <li>Enable collaboration features between users</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
            </ul>
        </section>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">3. Information Sharing</h3>
            <p className="text-slate-300 leading-relaxed">
                We do not sell your personal information. We may share your information only in the following
                circumstances:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mt-3">
                <li>With your consent or at your direction</li>
                <li>With other users as part of collaborative map features</li>
                <li>To comply with legal obligations</li>
                <li>To protect the rights and safety of Odyssey and our users</li>
            </ul>
        </section>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">4. Data Security</h3>
            <p className="text-slate-300 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction. However,
                no method of transmission over the Internet is 100% secure.
            </p>
        </section>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">5. Data Retention</h3>
            <p className="text-slate-300 leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to
                provide you services. You can request deletion of your account and associated data at any time.
            </p>
        </section>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">6. Your Rights</h3>
            <p className="text-slate-300 leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your information</li>
                <li>Object to processing of your information</li>
                <li>Export your data in a portable format</li>
            </ul>
        </section>

        <section className="mb-8">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">7. Cookies and Tracking</h3>
            <p className="text-slate-300 leading-relaxed">
                We use cookies and similar technologies to maintain your session, remember your preferences,
                and improve our Service. You can control cookies through your browser settings.
            </p>
        </section>

        <section>
            <h3 className="text-lg font-semibold text-purple-400 mb-3">8. Contact Us</h3>
            <p className="text-slate-300 leading-relaxed">
                If you have questions about this Privacy Policy or our privacy practices, please contact us at{' '}
                <a href="mailto:privacy@odyssey.app" className="text-purple-400 hover:text-purple-300">
                    privacy@odyssey.app
                </a>
            </p>
        </section>
    </div>
);

export default LegalPage;
