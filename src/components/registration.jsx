import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Registration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";

        if (!formData.username.trim()) {
            newErrors.username = "Username is required";
        } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
            newErrors.username = "Username must contain only letters and numbers";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (!passwordRegex.test(formData.password)) {
            newErrors.password = "Password must be at least 8 chars with uppercase, lowercase, number & special char";
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }
        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[@$!%*?&]/.test(password)) strength++;

        // Normalize to 0-4 scale
        if (strength <= 2) return 1;
        if (strength === 3) return 2;
        if (strength === 4) return 3;
        return 4;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Registration successful:', data);
                navigate('/');
            } else {
                setErrors({ submit: data.error || 'Registration failed' });
            }
        } catch (err) {
            console.error('Registration error:', err);
            setErrors({ submit: 'Network error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container fade-in">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                    </div>
                    <h1>Create Account</h1>
                    <p>Join us to simplify your data management</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
                    <div className={`form-group ${errors.fullName ? 'has-error' : ''}`}>
                        <label htmlFor="fullName">Full Name</label>
                        <div className="modern-input-wrapper">
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                className="modern-input"
                                placeholder="Enter name"
                                value={formData.fullName}
                                onChange={handleChange}
                                autoComplete="off"
                            />
                        </div>
                        {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                    </div>

                    <div className={`form-group ${errors.username ? 'has-error' : ''}`}>
                        <label htmlFor="username">Username</label>
                        <div className="modern-input-wrapper">
                            <input
                                type="text"
                                id="username"
                                name="username"
                                className="modern-input"
                                placeholder="Enter username"
                                value={formData.username}
                                onChange={handleChange}
                                autoComplete="off"
                            />
                        </div>
                        {errors.username && <span className="error-message">{errors.username}</span>}
                    </div>

                    <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                        <label htmlFor="email">Email Address</label>
                        <div className="modern-input-wrapper">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="modern-input"
                                placeholder="Enter email"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="off"
                            />
                        </div>
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
                        <label htmlFor="password">Password</label>
                        <div className="modern-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                className="modern-input"
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '4px'
                                }}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>

                        {formData.password && (
                            <div className="password-strength-container fade-in">
                                <div className="password-strength-header">
                                    <span className="password-strength-text">Password Strength</span>
                                    <span className="password-strength-text">
                                        {(() => {
                                            const s = calculatePasswordStrength(formData.password);
                                            if (s === 0) return 'Weak';
                                            if (s <= 2) return 'Fair';
                                            if (s <= 3) return 'Good';
                                            return 'Strong';
                                        })()}
                                    </span>
                                </div>

                                <div className="password-strength-bars">
                                    {[1, 2, 3, 4].map((level) => {
                                        const strength = calculatePasswordStrength(formData.password);
                                        let className = "strength-bar-segment";
                                        if (strength >= level) {
                                            className += " active";
                                            if (strength <= 1) className += " weak";
                                            else if (strength <= 2) className += " fair";
                                            else if (strength <= 3) className += " good";
                                            else className += " strong";
                                        }
                                        return <div key={level} className={className} />;
                                    })}
                                </div>

                                <div className="requirement-list">
                                    {[
                                        { regex: /.{8,}/, text: "At least 8 characters" },
                                        { regex: /[A-Z]/, text: "One uppercase letter" },
                                        { regex: /[a-z]/, text: "One lowercase letter" },
                                        { regex: /\d/, text: "One number" },
                                        { regex: /[@$!%*?&]/, text: "One special character (@$!%*?&)" }
                                    ].map((req, i) => (
                                        <div key={i} className={`requirement-item ${req.regex.test(formData.password) ? 'met' : ''}`}>
                                            <div className="requirement-icon">
                                                <span className="check-mark">✓</span>
                                            </div>
                                            <span>{req.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {errors.password && <span className="error-message" style={{ marginTop: '0.5rem', display: 'block' }}>{errors.password}</span>}
                    </div>

                    <div className={`form-group ${errors.confirmPassword ? 'has-error' : ''}`}>
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="modern-input-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                className="modern-input"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '4px'
                                }}
                            >
                                {showConfirmPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                        {formData.confirmPassword && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {formData.password === formData.confirmPassword ? (
                                    <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        Passwords match
                                    </span>
                                ) : (
                                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                        Passwords do not match
                                    </span>
                                )}
                            </div>
                        )}
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>

                    {errors.submit && (
                        <div className="error-alert" style={{ marginBottom: '1rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            {errors.submit}
                        </div>
                    )}

                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? (
                            <div className="loader-small" />
                        ) : (
                            <>
                                <span>Sign Up</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/" className="auth-link">Sign in</Link></p>
                </div>
            </div >
        </div >
    );
};

export default Registration;