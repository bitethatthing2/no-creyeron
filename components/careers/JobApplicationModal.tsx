'use client';

import { useState } from 'react';
import { X, Upload, CheckCircle, AlertCircle, FileText, User, Briefcase, MessageSquare } from 'lucide-react';
import { useToast } from '@/lib/hooks/useTypes';
import { supabase } from '@/lib/supabase';

interface JobApplicationModalProps {
  position: {
    title: string;
    location: string;
    type: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function JobApplicationModal({ position, isOpen, onClose }: JobApplicationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    
    // Experience & Availability
    previousExperience: '',
    relevantSkills: '',
    availability: {
      weekdays: false,
      weekends: false,
      evenings: false,
      holidays: false
    },
    startDate: '',
    hoursPerWeek: '',
    
    // Personality & Motivation
    whyThisJob: '',
    handlePressure: '',
    stayBusyExample: '',
    teamworkExample: '',
    challengingCustomer: '',
    
    // Additional Info
    references: '',
    additionalInfo: '',
    hasReliableTransportation: '',
    hasRightToWork: true
  });

  const [resume, setResume] = useState<File | null>(null);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('availability.')) {
      const availKey = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [availKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF or Word document.',
          variant: 'destructive'
        });
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB.',
          variant: 'destructive'
        });
        return;
      }
      
      setResume(file);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone);
      case 2:
        return !!(formData.startDate && formData.hoursPerWeek);
      case 3:
        return !!(formData.whyThisJob && formData.handlePressure && formData.stayBusyExample);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields before continuing.',
        variant: 'destructive'
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitApplication = async () => {
    if (!validateStep(3)) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let resumeUrl = null;
      
      // Upload resume to storage bucket if provided
      if (resume) {
        const fileName = `${Date.now()}_${formData.firstName}_${formData.lastName}_${resume.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('job-applications')
          .upload(`resumes/${fileName}`, resume);
        
        if (uploadError) {
          throw new Error('Failed to upload resume');
        }
        
        resumeUrl = uploadData.path;
      }

      // Submit application to database
      const applicationData = {
        position_title: position.title,
        position_location: position.location,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        previous_experience: formData.previousExperience,
        relevant_skills: formData.relevantSkills,
        availability: JSON.stringify(formData.availability),
        preferred_start_date: formData.startDate,
        hours_per_week: formData.hoursPerWeek,
        why_this_job: formData.whyThisJob,
        handle_pressure: formData.handlePressure,
        stay_busy_example: formData.stayBusyExample,
        teamwork_example: formData.teamworkExample,
        challenging_customer: formData.challengingCustomer,
        references: formData.references,
        additional_info: formData.additionalInfo,
        reliable_transportation: formData.hasReliableTransportation,
        right_to_work: formData.hasRightToWork,
        resume_url: resumeUrl,
        status: 'pending',
        submitted_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('job_applications')
        .insert([applicationData]);

      if (insertError) {
        throw new Error('Failed to submit application');
      }

      setSubmitSuccess(true);
      toast({
        title: 'Application submitted!',
        description: 'Thank you for applying. We\'ll be in touch soon!',
        variant: 'default'
      });

    } catch (error) {
      console.error('Application submission error:', error);
      toast({
        title: 'Submission failed',
        description: 'Something went wrong. Please try again or contact us directly.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-green-500/20 rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">Application Submitted!</h3>
          <p className="text-white/80 mb-6">
            Thank you for applying for the <span className="text-green-400 font-semibold">{position.title}</span> position. 
            We'll review your application and get back to you within 2-3 business days.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-full hover:from-green-700 hover:to-green-800 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-red-500/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Apply for {position.title}</h2>
            <p className="text-white/60">{position.location} • {position.type}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Step {currentStep} of 4</span>
            <span className="text-sm text-white/60">{Math.round((currentStep / 4) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-semibold text-white">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:outline-none"
                    placeholder="Your first name"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:outline-none"
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:outline-none"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:outline-none"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  City/Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:outline-none"
                  placeholder="Salem, Portland, etc."
                />
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Resume (Optional)
                </label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-red-500/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-white/50 mx-auto mb-2" />
                    <p className="text-white/70">
                      {resume ? resume.name : 'Click to upload your resume'}
                    </p>
                    <p className="text-white/50 text-sm mt-1">PDF or Word document (max 5MB)</p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Briefcase className="w-6 h-6 text-orange-500" />
                <h3 className="text-xl font-semibold text-white">Experience & Availability</h3>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Previous Experience
                </label>
                <textarea
                  value={formData.previousExperience}
                  onChange={(e) => handleInputChange('previousExperience', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-orange-500 focus:outline-none resize-none"
                  placeholder="Tell us about your relevant work experience, including restaurants, retail, customer service, etc. If you're new to the industry, tell us about other experiences that have prepared you for this role."
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Relevant Skills
                </label>
                <textarea
                  value={formData.relevantSkills}
                  onChange={(e) => handleInputChange('relevantSkills', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-orange-500 focus:outline-none resize-none"
                  placeholder="What skills do you have that would make you successful in this position? (communication, multitasking, teamwork, etc.)"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-4">
                  Availability (check all that apply)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'weekdays', label: 'Weekdays' },
                    { key: 'weekends', label: 'Weekends' },
                    { key: 'evenings', label: 'Evenings' },
                    { key: 'holidays', label: 'Holidays' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.availability[key as keyof typeof formData.availability]}
                        onChange={(e) => handleInputChange(`availability.${key}`, e.target.checked)}
                        className="w-4 h-4 text-orange-500 bg-white/10 border-white/20 rounded focus:ring-orange-500"
                      />
                      <span className="text-white/80">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Preferred Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Hours per Week *
                  </label>
                  <select
                    value={formData.hoursPerWeek}
                    onChange={(e) => handleInputChange('hoursPerWeek', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Select hours</option>
                    <option value="10-20">10-20 hours</option>
                    <option value="20-30">20-30 hours</option>
                    <option value="30-40">30-40 hours</option>
                    <option value="40+">40+ hours</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-semibold text-white">Tell Us About Yourself</h3>
                <p className="text-white/60 text-sm">(This is the most important part!)</p>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Why do you want to work at Side Hustle? *
                </label>
                <textarea
                  value={formData.whyThisJob}
                  onChange={(e) => handleInputChange('whyThisJob', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-yellow-500 focus:outline-none resize-none"
                  placeholder="What attracts you to working in our fast-paced sports bar environment? What excites you about hospitality?"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  How do you handle pressure and busy periods? *
                </label>
                <textarea
                  value={formData.handlePressure}
                  onChange={(e) => handleInputChange('handlePressure', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-yellow-500 focus:outline-none resize-none"
                  placeholder="Describe a time when you had to work under pressure or during a busy rush. How did you stay organized and maintain quality?"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  How do you stay productive during slower periods? *
                </label>
                <textarea
                  value={formData.stayBusyExample}
                  onChange={(e) => handleInputChange('stayBusyExample', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-yellow-500 focus:outline-none resize-none"
                  placeholder="The hospitality industry has ups and downs. Tell us how you stay busy and productive during quieter times."
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Teamwork Example
                </label>
                <textarea
                  value={formData.teamworkExample}
                  onChange={(e) => handleInputChange('teamworkExample', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-yellow-500 focus:outline-none resize-none"
                  placeholder="Tell us about a time when you had to work closely with a team to accomplish a goal."
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Difficult Customer Situation
                </label>
                <textarea
                  value={formData.challengingCustomer}
                  onChange={(e) => handleInputChange('challengingCustomer', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-yellow-500 focus:outline-none resize-none"
                  placeholder="How would you handle a challenging or upset customer? What's your approach to difficult situations?"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-green-500" />
                <h3 className="text-xl font-semibold text-white">Final Details</h3>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  References
                </label>
                <textarea
                  value={formData.references}
                  onChange={(e) => handleInputChange('references', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-green-500 focus:outline-none resize-none"
                  placeholder="Please provide 2-3 references with names, relationships, and contact information."
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Anything else you'd like us to know?
                </label>
                <textarea
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-green-500 focus:outline-none resize-none"
                  placeholder="Tell us anything else that makes you a great fit for the Wolf Pack team!"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Do you have reliable transportation?
                  </label>
                  <select
                    value={formData.hasReliableTransportation}
                    onChange={(e) => handleInputChange('hasReliableTransportation', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="right-to-work"
                    checked={formData.hasRightToWork}
                    onChange={(e) => handleInputChange('hasRightToWork', e.target.checked)}
                    className="w-4 h-4 text-green-500 bg-white/10 border-white/20 rounded focus:ring-green-500"
                  />
                  <label htmlFor="right-to-work" className="text-white/80 text-sm">
                    I am authorized to work in the United States
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-full hover:from-red-700 hover:to-orange-700 transition-all"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={submitApplication}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-full hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}