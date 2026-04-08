import { useState } from 'react';
import { Send, CheckCircle, Loader } from 'lucide-react';

export default function DemoForm() {
  const [formData, setFormData] = useState({
    name: '',
    schoolName: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = 'School name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/[-()\s]/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Here you would normally send data to your backend
    console.log('Demo request:', formData);

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', schoolName: '', email: '', phone: '' });
    }, 3000);
  };

  if (isSubmitted) {
    return (
      <section
        id="demo-form"
        className="py-16 md:py-24 bg-gradient-to-br from-success-50 to-white"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-medium border border-success-200 p-12 text-center">
              <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-success-600" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-3">
                Thank You!
              </h3>
              <p className="text-secondary-600 mb-6">
                Your demo request has been received. Our team will contact you
                within 24 hours to schedule your personalized demo.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-success-100 text-success-700 rounded-lg text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                Request Submitted Successfully
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="demo-form"
      className="py-16 md:py-24 bg-gradient-to-br from-primary-50 via-accent-50 to-white"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">
                Ready to Transform Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
                  School Management?
                </span>
              </h2>
              <p className="text-lg text-secondary-600 mb-6">
                Book a free personalized demo and see how our platform can
                streamline your institution's operations.
              </p>

              <ul className="space-y-4">
                {[
                  'No credit card required',
                  'Personalized walkthrough',
                  'All features included',
                  'Free 30-day trial after demo',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-success-600" />
                    </div>
                    <span className="text-secondary-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Form */}
            <div className="bg-white rounded-2xl shadow-medium border border-secondary-100 p-8">
              <h3 className="text-2xl font-bold text-secondary-900 mb-6">
                Book Your Free Demo
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-secondary-700 mb-2"
                  >
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${errors.name ? 'border-error-500' : 'border-secondary-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-error-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="schoolName"
                    className="block text-sm font-semibold text-secondary-700 mb-2"
                  >
                    School Name *
                  </label>
                  <input
                    type="text"
                    id="schoolName"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${errors.schoolName ? 'border-error-500' : 'border-secondary-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    placeholder="ABC International School"
                  />
                  {errors.schoolName && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.schoolName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-secondary-700 mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${errors.email ? 'border-error-500' : 'border-secondary-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    placeholder="john@school.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-secondary-700 mb-2"
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${errors.phone ? 'border-error-500' : 'border-secondary-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    placeholder="9876543210"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold rounded-xl shadow-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Book Demo Now
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 text-xs text-secondary-500 text-center">
                By submitting, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
