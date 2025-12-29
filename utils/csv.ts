
import { CreatorLead } from '../types';

export const downloadLeadsAsCSV = (leads: CreatorLead[]) => {
  if (leads.length === 0) return;

  const headers = ['Name', 'Username', 'Profile URL', 'Followers', 'Bio', 'Email', 'Phone', 'Category', 'City'];
  const csvRows = [
    headers.join(','),
    ...leads.map(lead => [
      `"${lead.name.replace(/"/g, '""')}"`,
      `"${lead.username.replace(/"/g, '""')}"`,
      `"${lead.profileUrl.replace(/"/g, '""')}"`,
      `"${lead.followers.replace(/"/g, '""')}"`,
      `"${lead.bio.replace(/"/g, '""')}"`,
      `"${lead.email.replace(/"/g, '""')}"`,
      `"${lead.phone.replace(/"/g, '""')}"`,
      `"${lead.category.replace(/"/g, '""')}"`,
      `"${lead.city.replace(/"/g, '""')}"`,
    ].join(','))
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `creator_leads_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
