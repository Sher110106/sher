import React from 'react';

interface EmailTemplateProps {
  teacherName: string;
  schoolName: string;
  subject: string;
  schedule?: any;
  meetingLink?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

const EmailTemplate = ({ 
  teacherName, 
  schoolName, 
  subject, 
  schedule, 
  meetingLink,
  status 
}: EmailTemplateProps) => {
  return (
    <div>
      <h1>Teaching Request Update</h1>
      <p>Teacher: {teacherName}</p>
      <p>School: {schoolName}</p>
      <p>Subject: {subject}</p>
      
      {status === 'accepted' && meetingLink && (
        <div>
          <p>Your teaching request has been accepted! Here are the meeting details:</p>
          <p><strong>Google Meet Link:</strong> <a href={meetingLink}>{meetingLink}</a></p>
          <p>Please click the link above to join the meeting at the scheduled time.</p>
        </div>
      )}

      {status === 'pending' && (
        <p>A new teaching request is awaiting your response.</p>
      )}

      {status === 'rejected' && (
        <p>Unfortunately, this teaching request has been declined.</p>
      )}

      {schedule && (
        <div>
          <p>Schedule Details:</p>
          <pre>{JSON.stringify(schedule, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default EmailTemplate;