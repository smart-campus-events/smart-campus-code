/* eslint-disable react/jsx-indent, @typescript-eslint/indent */
"use client";

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Bell, BoxArrowRight, Lock, PersonFill, PersonPlusFill } from 'react-bootstrap-icons';

const NavBar: React.FC = () => {
  const { data: session } = useSession();
  const currentUser = session?.user?.email;
  const userWithRole = session?.user as { email: string; randomKey: string };
  const role = userWithRole?.randomKey;
  const pathName = usePathname();

  return (
    <Navbar bg="white" expand="lg">
      <Container>
        <Navbar.Brand as={Link} href="/">
          <img
            className="h-8 w-auto"
            src="https://storage.googleapis.com/uxpilot-auth.appspot.com/d8899fadb3-5df15300b4c172c2ef67.png"
            alt="Manoa Compass Logo"
            style={{ height: '40px', width: 'auto' }} // Increased logo size
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto py-2" style={{ marginLeft: '20px' }}>
            <Nav.Link
              as={Link}
              href="/browse-events"
              active={pathName === '/browse-events'}
              style={{ marginRight: '15px', fontSize: '1.3rem' }} // Increased font size
            >
              Clubs
            </Nav.Link>
            <Nav.Link
              as={Link} 
              href="/get-events"
              active={pathName === '/get-events'}
              style={{ marginRight: '15px', fontSize: '1.3rem' }} // Increased font size
            >
              Events
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              href="/get-events" 
              active={pathName === '/get-events'}
              style={{ marginRight: '15px', fontSize: '1.3rem' }} // Increased font size
            >
              Map
            </Nav.Link>
            {currentUser && role === 'ADMIN' && (
              <Nav.Link 
                as={Link} 
                href="/admin" 
                id="admin-stuff-nav" 
                key="admin" 
                active={pathName === '/admin'}
              >
                Admin
              </Nav.Link>
            )}
          </Nav>
          <Nav>
            <Nav.Link
            style={{ marginRight: '15px', fontSize: '1.3rem' }}
            ><Bell/>
            </Nav.Link>
          </Nav>
          <Nav style={{ marginRight: '15px', fontSize: '1.9rem' }}>
  <img
    src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
    alt="Profile"
    className="rounded-full cursor-pointer"
    style={{ height: '40px', width: '40px', borderRadius: '50%' }} // Increased size and added borderRadius
  />
</Nav>
          <Nav>
            {session ? (
              <NavDropdown id="login-dropdown" title={currentUser}>
                <NavDropdown.Item
                  as={Link}
                  href="/api/auth/signout"
                  id="login-dropdown-sign-out"
                >
                  <BoxArrowRight />
                  Sign Out
                </NavDropdown.Item>
                <NavDropdown.Item
                  as={Link}
                  href="/auth/change-password"
                  id="login-dropdown-change-password"
                >
                  <Lock />
                  Change Password
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <NavDropdown id="login-dropdown" title="Login">
                <NavDropdown.Item
                  as={Link}
                  href="/auth/signin"
                  id="login-dropdown-sign-in"
                >
                  <PersonFill />
                  Sign in
                </NavDropdown.Item>
                <NavDropdown.Item
                  as={Link}
                  href="/auth/signup"
                  id="login-dropdown-sign-up"
                >
                  <PersonPlusFill />
                  Sign up
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;