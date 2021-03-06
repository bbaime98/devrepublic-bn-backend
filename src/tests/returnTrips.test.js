import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import sgMail from '@sendgrid/mail';
import index from '../index';
import { provideToken } from '../utils/tokenHandler';

const {
  expect
} = chai;
chai.use(chaiHttp);
let token;
let noManagerToken;

const notSignupToken = provideToken('dewdwwdwd', false, 'ade@gmail.com');
describe('CREATE A RETURN TRIP', () => {
  beforeEach(() => {
    sinon.stub(sgMail, 'send').resolves({
      to: 'aime@amgil.com',
      from: 'devrepublic@gmail.com',
      subject: 'barefoot nomad',
      html: 'this is stubbing message'
    });
  });
  afterEach(() => {
    sinon.restore();
  });
  before((done) => {
    const loggedUser = {
      email: 'jeannette@andela.com',
      password: 'Bien@BAR789',
    };
    chai
      .request(index)
      .post('/api/v1/auth/login')
      .send(loggedUser)
      .end((err, res) => {
        token = res.body.data;
        done();
      });
  });
  it('should create a return trip if all the data are given', (done) => {
    chai
      .request(index)
      .post('/api/v1/trips/return')
      .set('token', token)
      .send({
        destination: 'Nairobi',
        location: 'Kigali',
        departureDate: '2020-03-15',
        returnDate: '2020-05-01',
        reason: 'vacation',
        gender: 'Male',
        passportName: 'Jimmy Ntare',
        role: 'requester'
      })
      .end((err, res) => {
        expect(res.status).to.equal(201);
        expect(res.body.message).to.equal('Request created successfully');
        expect(res.body.data).to.be.an('object');
        expect(res.body.data.destination).to.equal('nairobi');
        expect(res.body.data.location).to.equal('kigali');
        expect(res.body.data.departureDate).to.equal('2020-03-15');
        expect(res.body.data.returnDate).to.equal('2020-05-01');
        expect(res.body.data.reason).to.equal('vacation');
        done();
      });
  });
  it('should not create a return trip if there is another trips with the same departure date', (done) => {
    chai
      .request(index)
      .post('/api/v1/trips/return')
      .set('token', token)
      .send({
        destination: 'Nairobi',
        location: 'Kigali',
        departureDate: '2020-03-15',
        returnDate: '2020-05-30',
        reason: 'vacation',
        gender: 'Male',
        passportName: 'Jimmy Ntare',
        role: 'requester'
      })
      .end((err, res) => {
        expect(res.status).to.equal(400);
        expect(res.body.error).to.equal('request with the same departure date exist');
        done();
      });
  });
  it('should not create a return trip if the return date is greater than the departure date', (done) => {
    chai
      .request(index)
      .post('/api/v1/trips/return')
      .set('token', token)
      .send({
        destination: 'Nairobi',
        location: 'Kigali',
        departureDate: '2020-03-15',
        returnDate: '2020-02-01',
        reason: 'vacation',
        gender: 'Male',
        passportName: 'Jimmy Ntare',
        role: 'requester'
      })
      .end((err, res) => {
        expect(res.status).to.equal(400);
        expect(res.body.error).to.equal('the return date must be greater than departure date');
        done();
      });
  });
  it('shouldn\'t create a return trip if all the data aren\'t given', (done) => {
    chai
      .request(index)
      .post('/api/v1/trips/return')
      .set('token', token)
      .send({
        location: 'kigali',
        departureDate: '2020-04-15',
        returnDate: '2020-05-01',
        reason: 'vacation',
        gender: 'Male',
        passportName: 'Jimmy Ntare',
        role: 'requester'
      })
      .end((err, res) => {
        expect(res.status).to.equal(400);
        expect(res.body.error[0]).to.equal('destination is required');
        done();
      });
  });
  it('shouldn\'t create a return trip if the user is not signup', (done) => {
    chai
      .request(index)
      .post('/api/v1/trips/return')
      .set('token', notSignupToken)
      .send({
        managerId: '79660e6f-4b7d-4d21-81ad-74f64e9e1c8a',
        destination: 'Nairobi',
        location: 'Kigali',
        departureDate: '2020-03-15',
        returnDate: '2020-05-01',
        reason: 'vacation',
      })
      .end((err, res) => {
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('you are not authorised for this operation');
        done();
      });
  });
});

describe('CHECK IF USER HAS A MANAGER', () => {
  before((done) => {
    const noManagerUser = {
      email: 'aime@andela.com',
      password: 'Aime12&*',
    };
    chai
      .request(index)
      .post('/api/v1/auth/login')
      .send(noManagerUser)
      .end((err, res) => {
        noManagerToken = res.body.data;
        done();
      });
  });
  it('should return that user needs a manager to create a trip', (done) => {
    chai
      .request(index)
      .post('/api/v1/trips/return')
      .set('token', noManagerToken)
      .send({
        destination: 'Nairobi',
        location: 'Kigali',
        departureDate: '2020-03-15',
        returnDate: '2020-05-01',
        reason: 'vacation',
        gender: 'Male',
        passportName: 'Jimmy Ntare',
        role: 'requester'
      })
      .end((err, res) => {
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('user should have manager before performing this operation');
        done();
      });
  });
});
