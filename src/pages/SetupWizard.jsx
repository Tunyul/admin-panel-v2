import React, { useState } from 'react';
import { Button, Stepper, Step, StepLabel, TextField, Box } from '@mui/material';
import useNotificationStore from '../store/notificationStore';

const steps = ['Profile', 'Company', 'Finish'];

export default function SetupWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [company, setCompany] = useState({ name: '', address: '' });
  const { showNotification } = useNotificationStore();

  const handleNext = () => {
    if (activeStep === 0 && (!profile.name || !profile.email)) return;
    if (activeStep === 1 && (!company.name || !company.address)) return;
    if (activeStep === steps.length - 1) {
      showNotification('Setup completed!', 'success');
      return;
    }
    setActiveStep((prev) => prev + 1);
  };
  const handleBack = () => setActiveStep((prev) => prev - 1);

  return (
    <div className="bg-[#23232b] dark:bg-[#23232b] rounded-2xl shadow-lg p-8 max-w-xl mx-auto mt-12">
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Box mt={6}>
        {activeStep === 0 && (
          <>
            <TextField label="Name" fullWidth margin="normal" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
            <TextField label="Email" fullWidth margin="normal" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
          </>
        )}
        {activeStep === 1 && (
          <>
            <TextField label="Company Name" fullWidth margin="normal" value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} />
            <TextField label="Address" fullWidth margin="normal" value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} />
          </>
        )}
        {activeStep === 2 && (
          <div className="text-center text-gray-100 text-xl font-bold">Setup Complete! 🎉</div>
        )}
      </Box>
      <Box mt={4} className="flex justify-between">
        <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
        <Button variant="contained" color="primary" onClick={handleNext}>
          {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </Box>
    </div>
  );
}
