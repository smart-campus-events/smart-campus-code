/* eslint-disable @typescript-eslint/no-unused-vars, max-len */

'use client';

import InitialAvatar from '@/components/InitialAvatar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Image,
  Row,
  Stack,
} from 'react-bootstrap';
import { CheckCircleFill, HouseDoorFill } from 'react-bootstrap-icons';
import SignupProgress from '../SignupProgress';

interface ProfileData {
  name?: string;
  firstName?: string;
  email: string;
  major?: string;
  interests: { id: string; name: string }[];
  avatar_url?: string;
}

export default function SignupStep5Page() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profileapi/profile', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data: ProfileData = await res.json();
        setProfile(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error || !profile) return <div className="p-4 text-center text-danger">{error || 'No profile data.'}</div>;

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Container className="py-4 py-md-5 flex-grow-1 d-flex flex-column">
        <SignupProgress currentStep={5} totalSteps={5} />

        <Row className="justify-content-center">
          <Col md={9} lg={7} xl={6} className="text-center">

            {/* Success Icon & Message */}
            <div className="mb-4 mb-md-5">
              <div
                className="bg-success-subtle rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                style={{ width: '80px', height: '80px' }}
              >
                <CheckCircleFill size={40} className="text-success" />
              </div>
              <h1 className="h2 fw-bold mb-2">Profile Setup Complete!</h1>
              <p className="lead text-muted">
                You&apos;re all set to explore everything UH Mānoa has to offer.
              </p>
            </div>

            {/* Profile Summary */}
            <Card className="shadow-sm border-light rounded-4 mb-4 mb-md-5">
              <Card.Body className="p-4 p-md-5">
                <Stack gap={3} className="align-items-center">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt="Profile Picture"
                      roundedCircle
                      style={{ width: '80px', height: '80px', border: '4px solid var(--bs-success)' }}
                    />
                  ) : (
                    <InitialAvatar name={profile.name || profile.firstName || profile.email} />
                  )}
                  <h3 className="h5 fw-semibold mb-0">{profile.name || profile.firstName || profile.email}</h3>
                  {profile.major && (
                  <p className="text-muted mb-2">
                    {profile.major}
                    {' '}
                    Major
                  </p>
                  )}
                  <Stack direction="horizontal" gap={2} className="flex-wrap justify-content-center">
                    {profile.interests.map((i) => (
                      <Badge key={i.id} pill bg="primary-subtle" text="primary-emphasis">
                        {i.name}
                      </Badge>
                    ))}
                  </Stack>
                </Stack>
              </Card.Body>
            </Card>

            {/* Actions */}
            <Stack gap={3} className="align-items-center col-md-8 mx-auto">
              <Link href="/dashboard" passHref>
                <Button variant="success" size="lg" className="w-100">
                  Go to Dashboard
                  {' '}
                  <HouseDoorFill className="ms-1" />
                </Button>
              </Link>
              <p className="text-muted small mb-0">
                Need help getting started? Check out our
                {' '}
                <Link href="/guide" className="fw-medium">quick guide</Link>
                .
              </p>
            </Stack>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
