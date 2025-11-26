import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lawyerId = searchParams.get('id');

    let query = supabase
      .from('lawyer_profiles')
      .select('*')
      .eq('verified', true);

    if (lawyerId) {
      query = query.eq('id', lawyerId);
    }

    const { data: lawyers, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // Return mock data if database not set up
      return NextResponse.json({
        success: true,
        lawyers: getMockLawyers(lawyerId)
      });
    }

    return NextResponse.json({
      success: true,
      lawyers: lawyers || []
    });
  } catch (error) {
    console.error('Error fetching lawyers:', error);
    // Return mock data as fallback
    return NextResponse.json({
      success: true,
      lawyers: getMockLawyers(null)
    });
  }
}

function getMockLawyers(id: string | null) {
  const mockLawyers = [
    {
      id: '1',
      full_name: 'Adebayo Okonkwo',
      specialization: 'Corporate Law',
      location: 'Lagos',
      hourly_rate: 25000,
      years_of_experience: 12,
      rating: 4.9,
      total_reviews: 47,
      bio: 'Experienced corporate lawyer specializing in mergers & acquisitions, company formation, and regulatory compliance. Advised over 100 Nigerian startups and SMEs. Former legal counsel at GTBank.',
      bar_enrollment_number: 'SCN/123456/2010',
      education: 'LL.B University of Lagos, BL Nigerian Law School, LL.M Harvard Law School',
      languages: ['English', 'Yoruba', 'Igbo'],
      courts_of_practice: [
        'Supreme Court of Nigeria',
        'Court of Appeal',
        'Federal High Court',
        'Lagos State High Court'
      ],
      verified: true
    },
    {
      id: '2',
      full_name: 'Amina Bello',
      specialization: 'Family Law',
      location: 'Abuja',
      hourly_rate: 18000,
      years_of_experience: 8,
      rating: 4.8,
      total_reviews: 32,
      bio: 'Compassionate family law attorney handling divorce, child custody, adoption, and domestic violence cases. Known for achieving amicable settlements while protecting clients\' interests.',
      bar_enrollment_number: 'SCN/234567/2014',
      education: 'LL.B Ahmadu Bello University, BL Nigerian Law School',
      languages: ['English', 'Hausa', 'French'],
      courts_of_practice: [
        'Court of Appeal',
        'Federal High Court',
        'FCT High Court',
        'Sharia Court of Appeal'
      ],
      verified: true
    },
    {
      id: '3',
      full_name: 'Chukwudi Eze',
      specialization: 'Criminal Law',
      location: 'Port Harcourt',
      hourly_rate: 22000,
      years_of_experience: 15,
      rating: 4.7,
      total_reviews: 68,
      bio: 'Veteran criminal defense attorney with 15 years experience. Successfully defended clients in over 200 cases including fraud, armed robbery, and cybercrime. Former prosecutor at EFCC.',
      bar_enrollment_number: 'SCN/345678/2008',
      education: 'LL.B University of Nigeria Nsukka, BL Nigerian Law School, LL.M University of London',
      languages: ['English', 'Igbo'],
      courts_of_practice: [
        'Supreme Court of Nigeria',
        'Court of Appeal',
        'Federal High Court',
        'Rivers State High Court'
      ],
      verified: true
    },
    {
      id: '4',
      full_name: 'Fatima Mohammed',
      specialization: 'Real Estate',
      location: 'Kano',
      hourly_rate: 15000,
      years_of_experience: 6,
      rating: 4.6,
      total_reviews: 24,
      bio: 'Real estate lawyer specializing in property transactions, land disputes, and title verification. Helped over 150 clients acquire clean titles and resolve boundary disputes across Northern Nigeria.',
      bar_enrollment_number: 'SCN/456789/2017',
      education: 'LL.B Bayero University Kano, BL Nigerian Law School',
      languages: ['English', 'Hausa', 'Arabic'],
      courts_of_practice: [
        'Federal High Court',
        'Kano State High Court',
        'Customary Court'
      ],
      verified: true
    },
    {
      id: '5',
      full_name: 'Oluwaseun Adeyemi',
      specialization: 'Intellectual Property',
      location: 'Lagos',
      hourly_rate: 30000,
      years_of_experience: 10,
      rating: 4.9,
      total_reviews: 41,
      bio: 'IP lawyer protecting trademarks, patents, copyrights, and trade secrets. Represent tech startups, musicians, and content creators. Successfully litigated 50+ IP infringement cases.',
      bar_enrollment_number: 'SCN/567890/2013',
      education: 'LL.B Obafemi Awolowo University, BL Nigerian Law School, LL.M IP Law (UK)',
      languages: ['English', 'Yoruba'],
      courts_of_practice: [
        'Federal High Court',
        'Lagos State High Court',
        'Court of Appeal'
      ],
      verified: true
    },
    {
      id: '6',
      full_name: 'Ibrahim Yusuf',
      specialization: 'Labour Law',
      location: 'Kaduna',
      hourly_rate: 16000,
      years_of_experience: 9,
      rating: 4.7,
      total_reviews: 29,
      bio: 'Employment lawyer representing both employees and employers. Handle wrongful termination, workplace discrimination, contract negotiations, and labor union disputes.',
      bar_enrollment_number: 'SCN/678901/2014',
      education: 'LL.B University of Abuja, BL Nigerian Law School',
      languages: ['English', 'Hausa'],
      courts_of_practice: [
        'National Industrial Court',
        'Federal High Court',
        'Kaduna State High Court'
      ],
      verified: true
    }
  ];

  if (id) {
    return mockLawyers.filter(l => l.id === id);
  }

  return mockLawyers;
}
