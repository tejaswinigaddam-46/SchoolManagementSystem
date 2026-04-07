import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Mobile Apps', href: '#mobile-apps' },
    ],
    company: [
      { label: 'About Us', href: '#about' },
      { label: 'Contact', href: '#contact' },
      { label: 'Careers', href: '#careers' },
      { label: 'Blog', href: '#blog' },
    ],
    support: [
      { label: 'Help Center', href: '#help' },
      { label: 'Documentation', href: '#docs' },
      { label: 'API Reference', href: '#api' },
      { label: 'System Status', href: '#status' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Cookie Policy', href: '#cookies' },
      { label: 'GDPR Compliance', href: '#gdpr' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Instagram, href: '#', label: 'Instagram' },
  ];

  return (
    <footer className="bg-secondary-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">SchoolERP</span>
            </div>
            <p className="text-secondary-400 mb-6 leading-relaxed">
              The most comprehensive school management software in India.
              Trusted by 500+ institutions for efficient administration,
              payroll, and student tracking.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <Mail className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:info@eukolia.shop"
                  className="text-secondary-400 hover:text-white transition-colors"
                >
                  info@eukolia.shop
                </a>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+911234567890"
                  className="text-secondary-400 hover:text-white transition-colors"
                >
                  +91 123 456 7890
                </a>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <span className="text-secondary-400">India</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-bold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-secondary-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-bold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-secondary-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-bold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-secondary-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-bold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-secondary-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SEO Keywords Section */}
        <div className="mt-12 pt-8 border-t border-secondary-800">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-white mb-2">
                School Management Software India
              </h4>
              <p className="text-secondary-400 text-xs leading-relaxed">
                Complete school ERP system for Indian schools with multi-tenant
                architecture, payroll, and attendance management.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">
                Student Management System
              </h4>
              <p className="text-secondary-400 text-xs leading-relaxed">
                Track student performance, attendance, fees, and academic
                progress with comprehensive analytics.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">
                Multi-Tenant School Software
              </h4>
              <p className="text-secondary-400 text-xs leading-relaxed">
                Cloud-based multi-tenant platform supporting multiple campuses
                with centralized administration.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">
                School ERP with Mobile App
              </h4>
              <p className="text-secondary-400 text-xs leading-relaxed">
                Mobile apps for parents and students with AI tutor, quiz
                generator, and real-time updates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-secondary-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-secondary-400">
              © {currentYear} SchoolERP. All rights reserved. | School
              Management Software India
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 bg-secondary-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-all duration-300 group"
                >
                  <social.icon className="w-4 h-4 text-secondary-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
