/* eslint-disable react/no-unescaped-entities, react/no-array-index-key */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Button,
  Col,
  Container,
  Image,
  Row,
  Spinner,
} from 'react-bootstrap';
import {
  BoxArrowRight,
  PencilSquare,
} from 'react-bootstrap-icons';

interface ProfileData {
  email: string,
  name?: string,
  firstName?: string,
  lastName?: string,
  avatarUrl?: string,
  major?: string,
  interests: { id: string; name: string }[],
  ageRange?: string,
  origin?: string,
  housingStatus?: string,
  comfortLevel?: number,
  graduationYear?: number,
  emailNotifications?: boolean,
  aboutMe?: string,
  createdAt: string,
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profileapi/profile', { credentials: 'include' });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }

        const rawData = await res.json();
        const mappedData: ProfileData = {
          email: rawData.email,
          name: rawData.name,
          firstName: rawData.firstName,
          lastName: rawData.lastName,
          avatarUrl: rawData.avatarUrl,
          major: rawData.major,
          interests: rawData.interests ?? [],
          ageRange: rawData.age_range,
          origin: rawData.origin,
          housingStatus: rawData.housingStatus,
          comfortLevel: rawData.comfortLevel,
          graduationYear: rawData.graduationYear,
          emailNotifications: rawData.emailNotifications,
          aboutMe: rawData.about_me,
          createdAt: rawData.createdAt ?? new Date().toISOString(),
        };
        setProfile(mappedData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-danger">
        Failed to load profile:
        <br />
        {error}
      </div>
    );
  }

  if (!profile) {
    return <div className="p-4 text-center">No profile data.</div>;
  }

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-4 py-md-5">
        <Row className="justify-content-center mb-5">
          <Col lg={8} className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <Image
                src={profile.avatarUrl ?? '/default-avatar.png'}
                alt="Avatar"
                roundedCircle
                style={{ width: 80, height: 80, border: '4px solid var(--bs-success)' }}
              />
              <div className="ms-3">
                <h1 className="h4 fw-bold mb-0">
                  {profile.firstName && profile.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile.name ?? profile.email}
                  <br />
                  <span>'s Profile</span>
                </h1>
                {profile.createdAt && (
                  <p className="text-muted mb-0">
                    Member since
                    <br />
                    {new Date(profile.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </p>
                )}
              </div>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => router.push('/profile/edit')}
              >
                <PencilSquare className="me-1" />
                <br />
                <span>Edit Profile</span>
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => router.push('/api/auth/signout')}
              >
                <BoxArrowRight className="me-1" />
                <br />
                <span>Logout</span>
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
